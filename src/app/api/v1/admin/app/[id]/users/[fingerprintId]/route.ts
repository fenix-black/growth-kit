import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; fingerprintId: string }> }
) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    const { id: appId, fingerprintId } = await params;

    // Fetch fingerprint with all related data
    const fingerprint = await prisma.fingerprint.findFirst({
      where: {
        id: fingerprintId,
        appId,
      },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
        },
        credits: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to recent 50 transactions
        },
        usage: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Recent usage
        },
        referrals: {
          where: { claimedAt: { not: null } },
          include: {
            referred: {
              include: {
                leads: {
                  where: { emailVerified: true },
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
        referredBy: {
          include: {
            referrer: {
              include: {
                leads: {
                  where: { emailVerified: true },
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!fingerprint) {
      return errors.notFound();
    }

    // Calculate credit balance
    const creditBalance = fingerprint.credits.reduce((sum, credit) => sum + credit.amount, 0);

    // Get latest verified lead
    const verifiedLead = fingerprint.leads.find(lead => lead.emailVerified);
    const latestLead = verifiedLead || fingerprint.leads[0];

    // Format referrals
    const referredUsers = fingerprint.referrals.map(ref => ({
      id: ref.referredId,
      fingerprintId: ref.referred?.fingerprint,
      email: ref.referred?.leads[0]?.email || null,
      name: ref.referred?.leads[0]?.name || null,
      claimedAt: ref.claimedAt,
      visitCount: ref.visitCount,
    }));

    // Format referred by
    const referredBy = fingerprint.referredBy ? {
      id: fingerprint.referredBy.referrerId,
      fingerprintId: fingerprint.referredBy.referrer?.fingerprint,
      email: fingerprint.referredBy.referrer?.leads[0]?.email || null,
      name: fingerprint.referredBy.referrer?.leads[0]?.name || null,
      claimedAt: fingerprint.referredBy.claimedAt,
    } : null;

    // Format response
    const userDetails = {
      id: fingerprint.id,
      fingerprintId: fingerprint.fingerprint,
      name: latestLead?.name || null,
      email: latestLead?.email || null,
      emailVerified: latestLead?.emailVerified || false,
      creditBalance,
      referralCode: fingerprint.referralCode,
      lastActiveAt: fingerprint.lastActiveAt || fingerprint.createdAt,
      createdAt: fingerprint.createdAt,
      lastDailyGrant: fingerprint.lastDailyGrant,
      leads: fingerprint.leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        emailVerified: lead.emailVerified,
        createdAt: lead.createdAt,
      })),
      creditHistory: fingerprint.credits.map(credit => ({
        id: credit.id,
        amount: credit.amount,
        reason: credit.reason,
        metadata: credit.metadata,
        createdAt: credit.createdAt,
      })),
      recentUsage: fingerprint.usage.map(usage => ({
        id: usage.id,
        action: usage.action,
        usdValue: usage.usdValue,
        createdAt: usage.createdAt,
      })),
      referredUsers,
      referredBy,
      stats: {
        totalCreditsEarned: fingerprint.credits.filter(c => c.amount > 0).reduce((sum, c) => sum + c.amount, 0),
        totalCreditsSpent: Math.abs(fingerprint.credits.filter(c => c.amount < 0).reduce((sum, c) => sum + c.amount, 0)),
        totalReferrals: fingerprint.referrals.length,
        totalActions: fingerprint.usage.length,
      },
    };

    return successResponse({ user: userDetails });
  } catch (error) {
    console.error('Error in /v1/admin/app/[id]/users/[fingerprintId] GET:', error);
    return errors.serverError();
  }
}
