import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { verifyClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimit';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleOptionsRequest } from '@/lib/middleware/corsOptions';
import { successResponse, errors } from '@/lib/utils/response';

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return errors.unauthorized();
    }

    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, rateLimits.api);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Get claim token from cookie or body
    const body = await request.json();
    const claimFromBody = body.claim;
    const claimFromCookie = request.cookies.get('ref_claim')?.value;
    const claimToken = claimFromBody || claimFromCookie;

    if (!claimToken) {
      return errors.badRequest('No referral claim found');
    }

    // Verify and decode claim token
    const claimPayload = verifyClaim(claimToken);
    if (!claimPayload) {
      return errors.badRequest('Invalid or expired claim token');
    }

    // Find the referral code's fingerprint
    const referrerFingerprint = await prisma.fingerprint.findUnique({
      where: { 
        referralCode: claimPayload.referralCode 
      },
    });

    if (!referrerFingerprint || referrerFingerprint.appId !== authContext.app.id) {
      return errors.badRequest('Invalid referral code');
    }

    // Find or create a referral record for this visit
    let referral = await prisma.referral.findFirst({
      where: {
        appId: authContext.app.id,
        referrerId: referrerFingerprint.id,
        claimToken: claimToken,
      },
    });

    if (!referral) {
      // Create new referral record if doesn't exist
      referral = await prisma.referral.create({
        data: {
          appId: authContext.app.id,
          referrerId: referrerFingerprint.id,
          claimToken: claimToken,
          claimExpiresAt: new Date(claimPayload.expiresAt),
          visitCount: 1,
          lastVisitAt: new Date(),
        },
      });
    } else {
      // Update visit count
      referral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'referral.visit_tracked',
        entityType: 'referral',
        entityId: referral.id,
        metadata: { 
          referralCode: claimPayload.referralCode,
          referrerId: referrerFingerprint.id,
          visitCount: referral.visitCount,
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Build response
    const response = successResponse({
      tracked: true,
      referralCode: claimPayload.referralCode,
      visitCount: referral.visitCount,
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/referral/visit:', error);
    return errors.serverError();
  }
}
