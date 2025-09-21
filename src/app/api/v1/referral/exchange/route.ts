import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { mintClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimit';
import { withCorsHeaders, handleCorsPreflightResponse } from '@/lib/middleware/cors';
import { successResponse, errors } from '@/lib/utils/response';
import { isValidReferralCode } from '@/lib/utils/validation';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsOrigins = process.env.CORS_ALLOWLIST?.split(',') || [];
  return handleCorsPreflightResponse(origin, corsOrigins);
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

    // Parse request body
    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode || !isValidReferralCode(referralCode)) {
      return errors.badRequest('Invalid referral code format');
    }

    const code = referralCode.toUpperCase();

    // Check if this is a master referral code for the app
    if (authContext.app.masterReferralCode === code) {
      // This is a master referral code - mint special claim token
      const claimToken = mintClaim(code, undefined, 7 * 24 * 60); // 7 days TTL for master codes
      
      // Log event
      await prisma.eventLog.create({
        data: {
          appId: authContext.app.id,
          event: 'master_referral.exchange',
          entityType: 'app',
          entityId: authContext.app.id,
          metadata: { 
            referralCode: code, 
            type: 'master',
            credits: authContext.app.masterReferralCredits,
          },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent'),
        },
      });

      // Return master referral claim
      const response = successResponse({
        claim: claimToken,
        type: 'master',
        credits: authContext.app.masterReferralCredits,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return withCorsHeaders(response, origin, authContext.app.corsOrigins);
    }

    // Find fingerprint with this referral code (regular referral)
    const referrer = await prisma.fingerprint.findUnique({
      where: { referralCode: code },
    });

    if (!referrer || referrer.appId !== authContext.app.id) {
      return errors.badRequest('Invalid referral code');
    }

    // Mint a short-lived claim token
    const claimToken = mintClaim(code, undefined, 5); // 5 minute TTL for exchange

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'referral.exchange',
        entityType: 'fingerprint',
        entityId: referrer.id,
        metadata: { referralCode: code },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Build response
    const response = successResponse({
      claim: claimToken,
      expiresIn: 300, // 5 minutes in seconds
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/referral/exchange:', error);
    return errors.serverError();
  }
}
