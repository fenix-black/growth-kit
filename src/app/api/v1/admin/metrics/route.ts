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

    // Get app ID from query params (optional)
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    // Base filter
    const appFilter = appId ? { appId } : {};

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
          event: true,
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
