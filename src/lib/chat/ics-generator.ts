/**
 * ICS Calendar Feed Generator
 * Generates .ics files for calendar subscriptions
 */

interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  organizerName?: string;
  organizerEmail?: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

/**
 * Format a date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escape text for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a single VEVENT component
 */
function generateEvent(event: ICSEvent): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    `SUMMARY:${escapeICS(event.summary)}`,
    `STATUS:${event.status}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }

  if (event.attendeeName && event.attendeeEmail) {
    lines.push(`ATTENDEE;CN=${escapeICS(event.attendeeName)}:mailto:${event.attendeeEmail}`);
  }

  if (event.organizerName && event.organizerEmail) {
    lines.push(`ORGANIZER;CN=${escapeICS(event.organizerName)}:mailto:${event.organizerEmail}`);
  }

  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

/**
 * Generate a complete ICS calendar file
 */
export function generateICS(
  events: ICSEvent[],
  calendarName: string,
  calendarDescription?: string
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GrowthKit//Chat Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  if (calendarDescription) {
    lines.push(`X-WR-CALDESC:${escapeICS(calendarDescription)}`);
  }

  // Add all events
  for (const event of events) {
    lines.push(generateEvent(event));
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Convert a ChatBooking to an ICS event
 */
export function bookingToICSEvent(booking: {
  id: string;
  startTime: Date;
  endTime: Date;
  attendeeName: string;
  attendeeEmail: string;
  status: string;
  notes?: string | null;
  meetingType: {
    name: string;
    description?: string | null;
  };
}): ICSEvent {
  const summary = `${booking.meetingType.name} - ${booking.attendeeName}`;
  
  let description = '';
  if (booking.meetingType.description) {
    description += booking.meetingType.description + '\n\n';
  }
  description += `Attendee: ${booking.attendeeName} (${booking.attendeeEmail})`;
  if (booking.notes) {
    description += `\n\nNotes: ${booking.notes}`;
  }

  return {
    uid: `growthkit-booking-${booking.id}@growth.fenixblack.ai`,
    summary,
    description,
    startTime: booking.startTime,
    endTime: booking.endTime,
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    status: booking.status === 'confirmed' ? 'CONFIRMED' : 
            booking.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE',
  };
}

