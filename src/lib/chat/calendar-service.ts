import { prisma } from '@/lib/db';
import { AvailabilitySlot, BookingRequest } from './types';
import { addHours, startOfHour, isWithinInterval, parseISO, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { sendBookingConfirmation } from './email-notifications';

export class CalendarService {
  /**
   * Get available time slots for a meeting type
   */
  static async getAvailability(
    appId: string,
    meetingTypeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilitySlot[]> {
    // Get meeting type
    const meetingType = await prisma.chatMeetingType.findFirst({
      where: { 
        id: meetingTypeId,
        isActive: true,
        calendarConfig: {
          config: { appId }
        }
      },
      include: {
        calendarConfig: true
      }
    });

    if (!meetingType) {
      return [];
    }

    const timezone = meetingType.calendarConfig.timezone;
    const workingHours = meetingType.calendarConfig.workingHours as Record<string, { start: string; end: string }>;
    
    // Get existing bookings in this range
    const existingBookings = await prisma.chatBooking.findMany({
      where: {
        appId,
        meetingTypeId,
        status: 'confirmed',
        startTime: { gte: startDate, lte: endDate }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Generate fixed hourly slots
    const slots: AvailabilitySlot[] = [];
    const current = startOfHour(startDate);
    
    while (current < endDate) {
      const zonedCurrent = toZonedTime(current, timezone);
      const dayOfWeek = format(zonedCurrent, 'EEEE').toLowerCase();
      const currentHour = format(zonedCurrent, 'HH:mm');
      
      // Check if within working hours
      const dayHours = workingHours[dayOfWeek];
      if (dayHours && currentHour >= dayHours.start && currentHour < dayHours.end) {
        // Check if slot is available
        const slotEnd = addHours(current, meetingType.durationMinutes / 60);
        
        const hasConflict = existingBookings.some(booking => 
          isWithinInterval(current, { start: booking.startTime, end: booking.endTime }) ||
          isWithinInterval(slotEnd, { start: booking.startTime, end: booking.endTime })
        );
        
        if (!hasConflict) {
          slots.push({
            startTime: current,
            endTime: slotEnd,
            meetingType: {
              id: meetingType.id,
              name: meetingType.name,
              durationMinutes: meetingType.durationMinutes
            }
          });
        }
      }
      
      current.setHours(current.getHours() + 1);
    }

    return slots;
  }

  /**
   * Create a booking
   */
  static async createBooking(
    appId: string,
    conversationId: string,
    booking: BookingRequest
  ): Promise<string> {
    // Verify slot is still available
    const endTime = addHours(booking.startTime, 0);
    const meetingType = await prisma.chatMeetingType.findUnique({
      where: { id: booking.meetingTypeId },
      select: { durationMinutes: true }
    });

    if (!meetingType) {
      throw new Error('Meeting type not found');
    }

    endTime.setMinutes(endTime.getMinutes() + meetingType.durationMinutes);

    // Check for conflicts
    const conflict = await prisma.chatBooking.findFirst({
      where: {
        appId,
        meetingTypeId: booking.meetingTypeId,
        status: 'confirmed',
        OR: [
          {
            startTime: { lte: booking.startTime },
            endTime: { gt: booking.startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          }
        ]
      }
    });

    if (conflict) {
      throw new Error('Time slot is no longer available');
    }

    // Find or create lead
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { fingerprintId: true }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    let lead = await prisma.lead.findFirst({
      where: {
        appId,
        fingerprintId: conversation.fingerprintId
      }
    });

    // Create lead if doesn't exist
    if (!lead && booking.attendeeEmail) {
      lead = await prisma.lead.create({
        data: {
          appId,
          fingerprintId: conversation.fingerprintId,
          email: booking.attendeeEmail,
          name: booking.attendeeName,
          emailVerified: false
        }
      });
    }

    // Create booking
    const newBooking = await prisma.chatBooking.create({
      data: {
        appId,
        meetingTypeId: booking.meetingTypeId,
        conversationId,
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail,
        startTime: booking.startTime,
        endTime,
        notes: booking.notes,
        status: 'confirmed'
      },
      include: {
        meetingType: true,
        app: {
          select: { name: true }
        }
      }
    });

    // Send confirmation email
    await sendBookingConfirmation(
      newBooking.attendeeEmail,
      newBooking.attendeeName,
      newBooking.meetingType.name,
      newBooking.startTime,
      newBooking.endTime,
      newBooking.app.name
    ).catch(error => {
      console.error('Failed to send booking confirmation:', error);
      // Don't fail the booking if email fails
    });

    return newBooking.id;
  }

  /**
   * Get meeting types for an app
   */
  static async getMeetingTypes(appId: string) {
    const config = await prisma.chatConfiguration.findUnique({
      where: { appId },
      include: {
        calendarConfig: {
          include: {
            meetingTypes: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    return config?.calendarConfig?.meetingTypes || [];
  }
}

