import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId');
    const fingerprintValue = searchParams.get('fingerprintId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!appId || !fingerprintValue) {
      return errors.badRequest('appId and fingerprintId are required');
    }

    // Get fingerprint by value
    const fingerprint = await prisma.fingerprint.findUnique({
      where: { 
        appId_fingerprint: {
          appId,
          fingerprint: fingerprintValue
        }
      },
    });

    if (!fingerprint) {
      return errors.notFound();
    }

    const fingerprintId = fingerprint.id;
    const startDate = subDays(new Date(), days);

    // Fetch event frequency
    const eventFrequency = await prisma.activity.groupBy({
      by: ['eventName'],
      where: {
        appId,
        fingerprintId,
        timestamp: { gte: startDate },
      },
      _count: {
        eventName: true,
      },
      orderBy: {
        _count: {
          eventName: 'desc',
        },
      },
    });

    // Fetch daily activity
    const activities = await prisma.activity.findMany({
      where: {
        appId,
        fingerprintId,
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Group by day
    const dailyMap = new Map<string, number>();
    activities.forEach(activity => {
      const day = format(activity.timestamp, 'yyyy-MM-dd');
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    });

    // Fill in missing days with 0
    const dailyActivity = [];
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyActivity.unshift({
        date,
        count: dailyMap.get(date) || 0,
      });
    }

    // Fetch hourly pattern
    const hourlyData = await prisma.$queryRaw<Array<{hour: number, count: bigint}>>`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM "activities"
      WHERE "appId" = ${appId} 
        AND "fingerprintId" = ${fingerprintId}
        AND timestamp >= ${startDate}
      GROUP BY hour
      ORDER BY hour
    `;

    // Calculate average per hour (normalize by number of days)
    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyData.find(h => Number(h.hour) === hour);
      const count = data ? Number(data.count) : 0;
      return {
        hour,
        avgCount: count / days,
      };
    });

    // Find most active hour
    const mostActiveHour = hourlyPattern.reduce((max, curr) => 
      curr.avgCount > max.avgCount ? curr : max
    ).hour;

    // Find most active day
    const dayOfWeekData = await prisma.$queryRaw<Array<{day: number, count: bigint}>>`
      SELECT 
        EXTRACT(DOW FROM timestamp) as day,
        COUNT(*) as count
      FROM "activities"
      WHERE "appId" = ${appId} 
        AND "fingerprintId" = ${fingerprintId}
        AND timestamp >= ${startDate}
      GROUP BY day
      ORDER BY count DESC
      LIMIT 1
    `;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = dayOfWeekData.length > 0 
      ? dayNames[Number(dayOfWeekData[0].day)]
      : 'N/A';

    // Calculate stats
    const totalEvents = activities.length;
    const uniqueEventTypes = eventFrequency.length;
    const avgEventsPerDay = totalEvents / days;

    return successResponse({
      stats: {
        totalEvents,
        uniqueEventTypes,
        avgEventsPerDay,
        mostActiveHour,
        mostActiveDay,
      },
      eventFrequency: eventFrequency.map(e => ({
        eventName: e.eventName,
        count: e._count.eventName,
      })),
      dailyActivity,
      hourlyPattern,
    });
  } catch (error) {
    console.error('Error fetching user analytics summary:', error);
    return errors.serverError();
  }
}
