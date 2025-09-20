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

    // Find fingerprint with this referral code
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
