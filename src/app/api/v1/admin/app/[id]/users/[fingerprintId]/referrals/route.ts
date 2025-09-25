import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

interface ReferralNode {
  id: string;
  fingerprintId: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  creditBalance: number;
  referralCount: number;
  claimedAt: Date | null;
  children: ReferralNode[];
}

async function buildReferralTree(
  fingerprintId: string,
  appId: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<ReferralNode | null> {
  if (currentDepth >= maxDepth) {
    return null;
  }

  const fingerprint = await prisma.fingerprint.findFirst({
    where: { id: fingerprintId, appId },
    include: {
      leads: {
        orderBy: { createdAt: 'desc' },
      },
      credits: true,
      referrals: {
        where: { claimedAt: { not: null } },
        include: {
          referred: true,
        },
      },
      _count: {
        select: { referrals: true },
      },
    },
  });

  if (!fingerprint) {
    return null;
  }

  // Calculate credit balance
  const creditBalance = fingerprint.credits.reduce((sum, credit) => sum + credit.amount, 0);

  // Get latest verified lead
  const verifiedLead = fingerprint.leads.find(lead => lead.emailVerified);
  const latestLead = verifiedLead || fingerprint.leads[0];

  // Build node
  const node: ReferralNode = {
    id: fingerprint.id,
    fingerprintId: fingerprint.fingerprint,
    name: latestLead?.name || null,
    email: latestLead?.email || null,
    emailVerified: latestLead?.emailVerified || false,
    creditBalance,
    referralCount: fingerprint.referrals.length,
    claimedAt: null, // Will be set by parent
    children: [],
  };

  // Recursively build children
  for (const referral of fingerprint.referrals) {
    if (referral.referred) {
      const childNode = await buildReferralTree(
        referral.referred.id,
        appId,
        maxDepth,
        currentDepth + 1
      );
      
      if (childNode) {
        childNode.claimedAt = referral.claimedAt;
        node.children.push(childNode);
      }
    }
  }

  return node;
}

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
    const { searchParams } = new URL(request.url);
    const maxDepth = parseInt(searchParams.get('maxDepth') || '3');

    // Verify fingerprint belongs to app
    const fingerprint = await prisma.fingerprint.findFirst({
      where: {
        id: fingerprintId,
        appId,
      },
    });

    if (!fingerprint) {
      return errors.notFound();
    }

    // Build referral tree
    const referralTree = await buildReferralTree(fingerprintId, appId, maxDepth);

    // Get referral statistics
    const stats = await prisma.$transaction([
      // Total referrals (direct)
      prisma.referral.count({
        where: {
          referrerId: fingerprintId,
          claimedAt: { not: null },
        },
      }),
      // Total credits earned from referrals
      prisma.credit.aggregate({
        where: {
          fingerprintId,
          reason: { contains: 'referral' },
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
    ]);

    const [totalDirectReferrals, referralCredits] = stats;

    return successResponse({
      referralTree,
      stats: {
        totalDirectReferrals,
        totalCreditsFromReferrals: referralCredits._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Error in /v1/admin/app/[id]/users/[fingerprintId]/referrals GET:', error);
    return errors.serverError();
  }
}
