import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    if (!fingerprintValue) {
      return errors.badRequest('fingerprintId is required');
    }

    // Verify app exists and get fingerprint
    const [app, fingerprint] = await Promise.all([
      prisma.app.findUnique({
        where: { id: appId },
      }),
      prisma.fingerprint.findUnique({
        where: { 
          appId_fingerprint: {
            appId,
            fingerprint: fingerprintValue
          }
        },
      }),
    ]);

    if (!app) {
      return errors.notFound();
    }

    if (!fingerprint) {
      return errors.notFound();
    }

    const fingerprintId = fingerprint.id;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Fetch activities and credits in parallel
    const [activities, credits] = await Promise.all([
      prisma.activity.findMany({
        where: {
          appId,
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
            appId,
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

    return successResponse({
      timeline: timelineWithGaps,
      pagination: {
        page,
        limit,
        total: timeline.length,
        totalPages: Math.ceil(timeline.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return errors.serverError();
  }
}
