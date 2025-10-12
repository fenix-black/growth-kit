import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { verifyAdminSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

// POST /api/admin/chat/calendar - Save calendar configuration
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    const session = verifyAdminSession(sessionCookie.value);
    if (!session || !session.email || !session.userId) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const { appId, timezone, workingHours, meetingTypes } = body;

    if (!appId || !timezone || !workingHours || !meetingTypes) {
      return errors.badRequest('Missing required fields');
    }

    // Get chat configuration
    const chatConfig = await prisma.chatConfiguration.findUnique({
      where: { appId }
    });

    if (!chatConfig) {
      return errors.badRequest('Chat configuration not found');
    }

    // Delete existing calendar config and meeting types
    await prisma.chatCalendarConfig.deleteMany({
      where: { configId: chatConfig.id }
    });

    // Create new calendar configuration
    const calendarConfig = await prisma.chatCalendarConfig.create({
      data: {
        configId: chatConfig.id,
        timezone,
        workingHours
      }
    });

    // Create meeting types
    const createdMeetingTypes = [];
    for (const meetingType of meetingTypes) {
      if (meetingType.name && meetingType.durationMinutes > 0) {
        const created = await prisma.chatMeetingType.create({
          data: {
            calendarConfigId: calendarConfig.id,
            name: meetingType.name,
            description: meetingType.description || '',
            durationMinutes: meetingType.durationMinutes,
            isActive: true
          }
        });
        createdMeetingTypes.push(created);
      }
    }

    return successResponse({
      calendarConfig: {
        id: calendarConfig.id,
        timezone: calendarConfig.timezone,
        workingHours: calendarConfig.workingHours
      },
      meetingTypes: createdMeetingTypes
    });

  } catch (error) {
    console.error('Error saving calendar configuration:', error);
    return errors.serverError();
  }
}

// GET /api/admin/chat/calendar - Get calendar configuration
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    const session = verifyAdminSession(sessionCookie.value);
    if (!session || !session.email || !session.userId) {
      return errors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return errors.badRequest('Missing appId parameter');
    }

    // Get chat configuration
    const chatConfig = await prisma.chatConfiguration.findUnique({
      where: { appId }
    });

    if (!chatConfig) {
      return successResponse({ calendarConfig: null, meetingTypes: [] });
    }

    // Get calendar configuration
    const calendarConfig = await prisma.chatCalendarConfig.findFirst({
      where: { configId: chatConfig.id },
      include: {
        meetingTypes: true
      }
    });

    return successResponse({
      calendarConfig: calendarConfig ? {
        id: calendarConfig.id,
        timezone: calendarConfig.timezone,
        workingHours: calendarConfig.workingHours
      } : null,
      meetingTypes: calendarConfig?.meetingTypes || []
    });

  } catch (error) {
    console.error('Error fetching calendar configuration:', error);
    return errors.serverError();
  }
}
