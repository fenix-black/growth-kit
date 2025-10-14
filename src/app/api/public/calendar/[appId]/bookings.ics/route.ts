/**
 * Public ICS Calendar Feed Endpoint
 * Returns an .ics file with all bookings for an app
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateICS, bookingToICSEvent } from '@/lib/chat/ics-generator';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    appId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { appId } = await context.params;

    // Fetch the app
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: {
        id: true,
        name: true,
        chatConfig: {
          select: {
            enabled: true,
            enableCalendar: true,
          },
        },
      },
    });

    if (!app) {
      return new NextResponse('App not found', { status: 404 });
    }

    if (!app.chatConfig?.enabled || !app.chatConfig?.enableCalendar) {
      return new NextResponse('Calendar not enabled for this app', { status: 403 });
    }

    // Fetch all bookings for this app
    const bookings = await prisma.chatBooking.findMany({
      where: {
        appId,
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      include: {
        meetingType: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Convert bookings to ICS events
    const icsEvents = bookings.map(bookingToICSEvent);

    // Generate ICS file
    const calendarName = `${app.name} - Chat Bookings`;
    const calendarDescription = `Calendar feed for chat bookings from ${app.name}`;
    const icsContent = generateICS(icsEvents, calendarName, calendarDescription);

    // Return ICS file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${app.id}-bookings.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('ICS calendar feed error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

