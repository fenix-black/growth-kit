import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId');

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sevenDaysAgo = subDays(now, 7);
    const oneDayAgo = subDays(now, 1);

    // Get all users with their activity stats
    const userStats = await prisma.$queryRaw<Array<{
      fingerprintId: string;
      totalEvents: bigint;
      firstActivity: Date;
      lastActivity: Date;
      daysActive: bigint;
      avgEventsPerDay: number;
      recentEvents: bigint;
    }>>`
      WITH user_activity AS (
        SELECT 
          "fingerprintId",
          COUNT(*) as total_events,
          MIN(timestamp) as first_activity,
          MAX(timestamp) as last_activity,
          COUNT(DISTINCT DATE(timestamp)) as days_active,
          COUNT(CASE WHEN timestamp >= ${sevenDaysAgo} THEN 1 END) as recent_events
        FROM "activities"
        WHERE "appId" = ${appId}
          AND timestamp >= ${thirtyDaysAgo}
        GROUP BY "fingerprintId"
      )
      SELECT 
        "fingerprintId",
        total_events as "totalEvents",
        first_activity as "firstActivity",
        last_activity as "lastActivity",
        days_active as "daysActive",
        ROUND(total_events::numeric / NULLIF(days_active, 0), 2) as "avgEventsPerDay",
        recent_events as "recentEvents"
      FROM user_activity
    `;

    // Define segments
    const segments = {
      powerUsers: {
        name: 'Power Users',
        description: 'High activity, consistent engagement',
        users: [] as string[],
        criteria: 'More than 10 events per day on average',
        color: 'purple',
      },
      activeUsers: {
        name: 'Active Users',
        description: 'Regular engagement',
        users: [] as string[],
        criteria: 'Active in the last 7 days with 3+ events per day',
        color: 'blue',
      },
      newUsers: {
        name: 'New Users',
        description: 'Recently joined',
        users: [] as string[],
        criteria: 'First activity within last 7 days',
        color: 'green',
      },
      atRiskUsers: {
        name: 'At Risk',
        description: 'Declining engagement',
        users: [] as string[],
        criteria: 'No activity in last 7 days but active before',
        color: 'orange',
      },
      dormantUsers: {
        name: 'Dormant Users',
        description: 'Inactive for extended period',
        users: [] as string[],
        criteria: 'No activity in last 14 days',
        color: 'red',
      },
    };

    // Classify users into segments
    userStats.forEach(user => {
      const avgEventsPerDay = Number(user.avgEventsPerDay);
      const totalEvents = Number(user.totalEvents);
      const recentEvents = Number(user.recentEvents);
      const daysSinceLastActivity = Math.floor(
        (now.getTime() - user.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isNewUser = user.firstActivity >= sevenDaysAgo;

      if (avgEventsPerDay > 10 && recentEvents > 0) {
        segments.powerUsers.users.push(user.fingerprintId);
      } else if (recentEvents > 0 && avgEventsPerDay >= 3) {
        segments.activeUsers.users.push(user.fingerprintId);
      } else if (isNewUser) {
        segments.newUsers.users.push(user.fingerprintId);
      } else if (daysSinceLastActivity >= 7 && daysSinceLastActivity < 14) {
        segments.atRiskUsers.users.push(user.fingerprintId);
      } else if (daysSinceLastActivity >= 14) {
        segments.dormantUsers.users.push(user.fingerprintId);
      }
    });

    // Get sample users for each segment
    const segmentData = await Promise.all(
      Object.entries(segments).map(async ([key, segment]) => {
        const sampleUsers = segment.users.slice(0, 3);
        const sampleFingerprints = sampleUsers.length > 0
          ? await prisma.fingerprint.findMany({
              where: {
                id: { in: sampleUsers },
                appId,
              },
              include: {
                leads: {
                  where: { emailVerified: true },
                  select: { email: true, name: true },
                  take: 1,
                },
              },
              take: 3,
            })
          : [];

        return {
          key,
          name: segment.name,
          description: segment.description,
          criteria: segment.criteria,
          color: segment.color,
          count: segment.users.length,
          percentage: userStats.length > 0 
            ? parseFloat(((segment.users.length / userStats.length) * 100).toFixed(2))
            : 0,
          sampleUsers: sampleFingerprints.map(fp => ({
            fingerprintId: fp.fingerprint,
            email: fp.leads[0]?.email || null,
            name: fp.leads[0]?.name || null,
          })),
        };
      })
    );

    // Calculate segment trends (compare to previous period)
    const previousPeriodStats = await prisma.$queryRaw<Array<{
      segmentChange: number;
    }>>`
      WITH previous_period AS (
        SELECT COUNT(DISTINCT "fingerprintId") as count
        FROM "activities"
        WHERE "appId" = ${appId}
          AND timestamp >= ${subDays(now, 60)}
          AND timestamp < ${thirtyDaysAgo}
      ),
      current_period AS (
        SELECT COUNT(DISTINCT "fingerprintId") as count
        FROM "activities"
        WHERE "appId" = ${appId}
          AND timestamp >= ${thirtyDaysAgo}
      )
      SELECT 
        CASE 
          WHEN previous_period.count = 0 THEN 100
          ELSE ROUND(((current_period.count - previous_period.count)::numeric / previous_period.count) * 100, 2)
        END as "segmentChange"
      FROM previous_period, current_period
    `;

    const overallGrowth = previousPeriodStats[0]?.segmentChange || 0;

    return successResponse({
      segments: segmentData,
      totalUsers: userStats.length,
      overallGrowth: Number(overallGrowth),
      period: {
        start: thirtyDaysAgo,
        end: now,
        days: 30,
      },
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return errors.serverError();
  }
}
