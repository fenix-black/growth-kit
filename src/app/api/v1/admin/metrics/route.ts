import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const event = searchParams.get('event');
    const timeRange = searchParams.get('timeRange');

    // Base filter
    const appFilter = appId ? { appId } : {};
    
    // If requesting specific event logs (like cron jobs)
    if (event) {
      // Calculate date range
      let dateFilter = {};
      if (timeRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (timeRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0); // All time
        }
        
        dateFilter = { createdAt: { gte: startDate } };
      }
      
      // Fetch event logs
      const events = await prisma.eventLog.findMany({
        where: {
          ...appFilter,
          event,
          ...dateFilter,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          app: {
            select: {
              name: true,
            },
          },
        },
      });
      
      // Format events for cron job monitor
      const formattedEvents = events.map(e => ({
        id: e.id,
        appId: e.appId,
        appName: e.app?.name || 'Unknown App',
        event: e.event,
        metadata: e.metadata || {},
        createdAt: e.createdAt.toISOString(),
      }));
      
      return successResponse({
        events: formattedEvents,
      });
    }

    // Get overall metrics
    const [
      totalFingerprints,
      totalReferrals,
      totalLeads,
      totalWaitlist,
      totalCreditsIssued,
      totalCreditsConsumed,
      recentEvents,
    ] = await Promise.all([
      // Total unique fingerprints
      prisma.fingerprint.count({
        where: appFilter,
      }),

      // Total referrals
      prisma.referral.count({
        where: {
          ...appFilter,
          claimedAt: { not: null },
        },
      }),

      // Total leads captured
      prisma.lead.count({
        where: appFilter,
      }),

      // Total waitlist entries
      prisma.waitlist.count({
        where: appFilter,
      }),

      // Total credits issued
      prisma.credit.aggregate({
        where: {
          fingerprint: appFilter,
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),

      // Total credits consumed
      prisma.credit.aggregate({
        where: {
          fingerprint: appFilter,
          amount: { lt: 0 },
        },
        _sum: { amount: true },
      }),

      // Recent events
      prisma.eventLog.findMany({
        where: appFilter,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          event: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate conversion metrics
    const verifiedEmails = await prisma.lead.count({
      where: {
        ...appFilter,
        emailVerified: true,
      },
    });

    const invitedWaitlist = await prisma.waitlist.count({
      where: {
        ...appFilter,
        status: 'INVITED',
      },
    });

    // Time-based metrics (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [
      dailyFingerprints,
      dailyReferrals,
      dailyActions,
    ] = await Promise.all([
      prisma.fingerprint.count({
        where: {
          ...appFilter,
          createdAt: { gte: oneDayAgo },
        },
      }),

      prisma.referral.count({
        where: {
          ...appFilter,
          claimedAt: { gte: oneDayAgo },
        },
      }),

      prisma.usage.count({
        where: {
          fingerprint: appFilter,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    // Calculate referral conversion rate
    const referralVisits = await prisma.referral.count({
      where: appFilter,
    });

    const referralConversionRate = referralVisits > 0 
      ? (totalReferrals / referralVisits * 100).toFixed(2)
      : 0;

    // Calculate email verification rate
    const emailVerificationRate = totalLeads > 0
      ? (verifiedEmails / totalLeads * 100).toFixed(2)
      : 0;

    // Event frequency analysis
    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return successResponse({
      overview: {
        totalFingerprints,
        totalReferrals,
        totalLeads,
        verifiedEmails,
        totalWaitlist,
        invitedWaitlist,
        totalCreditsIssued: totalCreditsIssued._sum.amount || 0,
        totalCreditsConsumed: Math.abs(totalCreditsConsumed._sum.amount || 0),
      },
      daily: {
        fingerprints: dailyFingerprints,
        referrals: dailyReferrals,
        actions: dailyActions,
      },
      conversion: {
        referralConversionRate: parseFloat(referralConversionRate.toString()),
        emailVerificationRate: parseFloat(emailVerificationRate.toString()),
      },
      recentActivity: {
        eventCounts,
        totalEvents: recentEvents.length,
      },
    });
  } catch (error) {
    console.error('Error in /v1/admin/metrics:', error);
    return errors.serverError();
  }
}
