import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';

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

    // Verify origin is allowed for this app (includes default origins)
    if (origin && !isOriginAllowed(origin, app.corsOrigins)) {
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

    // Find the referrer by their referral code
    const referrer = await prisma.fingerprint.findFirst({
      where: {
        appId: app.id,
        referralCode: referralCode,
      },
    });

    if (!referrer) {
      return corsErrors.badRequest('Invalid referral code', origin);
    }

    // Can't refer yourself
    if (referrer.id === fingerprint.id) {
      return corsErrors.badRequest('Cannot refer yourself', origin);
    }

    // Get app policy for credit amounts
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        policyJson: true,
        creditsPaused: true,
      },
    });

    const policy = appSettings?.policyJson as any;
    const referralCredits = policy?.referralCredits;
    const referredCredits = policy?.referredCredits;

    if (!referralCredits || !referredCredits) {
      return corsErrors.serverError('App policy not configured properly', origin);
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

    // Award credits to BOTH users (if credits not paused)
    if (!appSettings?.creditsPaused) {
      // Award credits to the referrer
      await prisma.credit.create({
        data: {
          fingerprintId: referrer.id,
          amount: referralCredits,
          reason: 'referral',
          metadata: {
            referredId: fingerprint.id,
            referralId: referral.id,
          },
        },
      });

      // Award credits to the referred user
      await prisma.credit.create({
        data: {
          fingerprintId: fingerprint.id,
          amount: referredCredits,
          reason: 'referral',
          metadata: {
            referrerId: referrer.id,
            referralCode: referralCode,
            referralId: referral.id,
          },
        },
      });
    }

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
