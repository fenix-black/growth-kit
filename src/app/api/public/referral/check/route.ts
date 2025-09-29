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

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return corsErrors.badRequest('Referral code is required', origin);
    }

    // Check if this fingerprint is already referred by someone
    const existingReferral = await prisma.referral.findFirst({
      where: { 
        appId: app.id,
        referredId: fingerprint.id 
      },
    });

    if (existingReferral) {
      return withCorsHeaders(
        successResponse({
          alreadyReferred: true,
          message: 'This user has already been referred',
        }),
        origin,
        app.corsOrigins
      );
    }

    // Find the referrer by their referral code (fingerprint)
    const referrer = await prisma.fingerprint.findFirst({
      where: {
        appId: app.id,
        fingerprint: referralCode,
      },
    });

    if (!referrer) {
      return corsErrors.badRequest('Invalid referral code', origin);
    }

    // Can't refer yourself
    if (referrer.id === fingerprint.id) {
      return corsErrors.badRequest('Cannot refer yourself', origin);
    }

    // Create the referral relationship
    const referral = await prisma.referral.create({
      data: {
        appId: app.id,
        referrerId: referrer.id,
        referredId: fingerprint.id,
        claimedAt: new Date(),
        visitCount: 1,
        lastVisitAt: new Date(),
      },
    });

    // Award credits to the referrer (default 10 credits, but could be configurable)
    const referralCredits = app.id ? 10 : 10; // TODO: Make this configurable per app
    
    await prisma.credit.create({
      data: {
        fingerprintId: referrer.id,
        amount: referralCredits,
        reason: 'referral_bonus',
        metadata: {
          referredFingerprintId: fingerprint.id,
          referralId: referral.id,
        },
      },
    });

    return withCorsHeaders(
      successResponse({
        referred: true,
        referralId: referral.id,
        creditsAwarded: referralCredits,
        referrer: {
          id: referrer.id,
          fingerprintId: referrer.fingerprint,
        },
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public referral check error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
