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
    const fingerprintId = searchParams.get('fingerprintId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!fingerprintId) {
      return new Response(
        JSON.stringify({ error: 'fingerprintId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
        }
      );
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Fetch activities and credits in parallel
    const [activities, credits] = await Promise.all([
      prisma.activity.findMany({
        where: {
          appId: authContext.app.id,
          fingerprintId,
          ...(startDate || endDate ? { timestamp: dateFilter } : {}),
        },
        select: {
          id: true,
          eventName: true,
          properties: true,
          context: true,
          timestamp: true,
        },
      }),
      prisma.credit.findMany({
        where: {
          fingerprint: {
            id: fingerprintId,
            appId: authContext.app.id,
          },
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        select: {
          id: true,
          reason: true,
          amount: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    // Combine and sort timeline items
    const timeline = [
      ...activities.map(activity => ({
        id: activity.id,
        type: 'activity' as const,
        timestamp: activity.timestamp,
        eventName: activity.eventName,
        properties: activity.properties,
        context: activity.context,
      })),
      ...credits.map(credit => ({
        id: credit.id,
        type: 'operation' as const,
        timestamp: credit.createdAt,
        action: credit.reason,
        amount: credit.amount,
        metadata: credit.metadata,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedTimeline = timeline.slice(
      (page - 1) * limit,
      page * limit
    );

    // Calculate time gaps
    const timelineWithGaps = paginatedTimeline.map((item, index) => {
      if (index === paginatedTimeline.length - 1) {
        return { ...item, timeGap: null };
      }
      
      const nextItem = paginatedTimeline[index + 1];
      const gap = item.timestamp.getTime() - nextItem.timestamp.getTime();
      
      // Only show gap if > 5 minutes
      return {
        ...item,
        timeGap: gap > 5 * 60 * 1000 ? gap : null,
      };
    });

    return new Response(
      JSON.stringify({
        timeline: timelineWithGaps,
        pagination: {
          page,
          limit,
          total: timeline.length,
          totalPages: Math.ceil(timeline.length / limit),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      }
    );
  }
}
