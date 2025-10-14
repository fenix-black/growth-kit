/**
 * Admin API: Fetch chat bookings for an app
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return errorResponse('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return errorResponse('BAD_REQUEST', 'Missing appId', 400);
    }

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errorResponse('NOT_FOUND', 'App not found', 404);
    }

    // Fetch bookings
    const bookings = await prisma.chatBooking.findMany({
      where: {
        appId,
      },
      include: {
        meetingType: {
          select: {
            name: true,
            description: true,
            durationMinutes: true,
          },
        },
        conversation: {
          select: {
            id: true,
            fingerprint: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 100, // Limit to most recent 100 bookings
    });

    return successResponse(
      {
        bookings: bookings.map(booking => ({
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          attendeeName: booking.attendeeName,
          attendeeEmail: booking.attendeeEmail,
          status: booking.status,
          notes: booking.notes,
          createdAt: booking.createdAt,
          meetingType: {
            name: booking.meetingType.name,
            description: booking.meetingType.description,
            duration: booking.meetingType.durationMinutes,
          },
          conversationId: booking.conversation?.id || null,
        })),
      },
      200
    );
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
}

