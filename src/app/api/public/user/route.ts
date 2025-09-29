import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app, fingerprint } = authContext;

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    // Parse request body (for compatibility with original /v1/me endpoint)
    const body = await request.json();
    const { claim } = body; // Optional claim parameter like the original endpoint

    // TODO: Handle referral claims in public mode if needed
    // For now, we'll skip claim processing to keep it simple

    // Get user data for this fingerprint
    const [credits, lead, referrals] = await Promise.all([
      // Get total credits
      prisma.credit.aggregate({
        where: { fingerprintId: fingerprint.id },
        _sum: { amount: true },
      }),
      
      // Get lead information if exists
      prisma.lead.findFirst({
        where: { fingerprintId: fingerprint.id },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      
      // Get referral stats
      prisma.referral.findMany({
        where: { referrerId: fingerprint.id },
        select: {
          id: true,
          claimedAt: true,
          referred: {
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    const totalCredits = credits._sum.amount || 0;
    const totalReferrals = referrals.length;
    const claimedReferrals = referrals.filter(r => r.claimedAt && r.referred).length;

    // Get referral code for this fingerprint
    const referralCode = fingerprint.fingerprint; // Using fingerprint as referral code

    const userData = {
      fingerprintId: fingerprint.id,
      credits: totalCredits,
      referrals: {
        total: totalReferrals,
        claimed: claimedReferrals,
        pending: totalReferrals - claimedReferrals,
      },
      referralCode,
      profile: lead ? {
        name: lead.name,
        email: lead.email,
        emailVerified: lead.emailVerified,
        joinedAt: lead.createdAt,
      } : null,
    };

    return withCorsHeaders(
      successResponse(userData),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public user error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
