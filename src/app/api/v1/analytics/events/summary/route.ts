import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { corsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin, ['*']);
  return new Response(null, { status: 200, headers });
}

export async function GET(request: NextRequest) {
  try {
    // Verify app authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch event frequency data
    const eventFrequency = await prisma.activity.groupBy({
      by: ['eventName'],
      where: {
        appId: authContext.app.id,
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
      take: 10, // Top 10 events
    });

    // Fetch device breakdown
    const deviceBreakdown = await prisma.$queryRaw<Array<{device: string, count: bigint}>>`
      SELECT context->>'device' as device, COUNT(*) as count
      FROM "Activity"
      WHERE "appId" = ${authContext.app.id} AND timestamp >= ${startDate}
      GROUP BY context->>'device'
      ORDER BY count DESC
    `;

    // Fetch browser breakdown
    const browserBreakdown = await prisma.$queryRaw<Array<{browser: string, count: bigint}>>`
      SELECT context->>'browser' as browser, COUNT(*) as count
      FROM "Activity"
      WHERE "appId" = ${authContext.app.id} AND timestamp >= ${startDate}
      GROUP BY context->>'browser'
      ORDER BY count DESC
    `;

    // Fetch hourly activity for heatmap
    const hourlyActivity = await prisma.$queryRaw<Array<{hour: number, day_of_week: number, count: bigint}>>`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        EXTRACT(DOW FROM timestamp) as day_of_week,
        COUNT(*) as count
      FROM "Activity"
      WHERE "appId" = ${authContext.app.id} AND timestamp >= ${startDate}
      GROUP BY hour, day_of_week
      ORDER BY day_of_week, hour
    `;

    // Get total stats
    const [totalEvents, uniqueUsers, eventsToday] = await Promise.all([
      prisma.activity.count({
        where: {
          appId: authContext.app.id,
          timestamp: { gte: startDate },
        },
      }),
      prisma.activity.groupBy({
        by: ['fingerprintId'],
        where: {
          appId: authContext.app.id,
          timestamp: { gte: startDate },
        },
      }).then(result => result.length),
      prisma.activity.count({
        where: {
          appId: authContext.app.id,
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Convert BigInt to number for JSON serialization
    const formatBreakdown = (data: any[]) => 
      data.map(item => ({ ...item, count: Number(item.count) }));

    return new Response(
      JSON.stringify({
        stats: {
          totalEvents,
          uniqueUsers,
          eventsToday,
          eventsPerUser: uniqueUsers > 0 ? Math.round(totalEvents / uniqueUsers) : 0,
        },
        eventFrequency: eventFrequency.map(event => ({
          eventName: event.eventName,
          count: event._count.eventName,
        })),
        deviceBreakdown: formatBreakdown(deviceBreakdown),
        browserBreakdown: formatBreakdown(browserBreakdown),
        hourlyActivity: hourlyActivity.map(item => ({
          hour: Number(item.hour),
          dayOfWeek: Number(item.day_of_week),
          count: Number(item.count),
        })),
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching event summary:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      }
    );
  }
}
