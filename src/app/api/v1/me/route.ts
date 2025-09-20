import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateReferralCode } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimit';
import { withCorsHeaders, handleCorsPreflightResponse } from '@/lib/middleware/cors';
import { successResponse, errors } from '@/lib/utils/response';
import { isValidFingerprint } from '@/lib/utils/validation';

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

    // Rate limiting by IP
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, rateLimits.api);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Get fingerprint from request body
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    // Rate limiting by fingerprint
    const fingerprintRateLimit = await checkRateLimit(
      `${authContext.app.id}:${fingerprint}`,
      rateLimits.fingerprint
    );
    if (!fingerprintRateLimit.success) {
      return fingerprintRateLimit.response!;
    }

    // Upsert fingerprint record
    let fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: authContext.app.id,
          fingerprint,
        },
      },
      include: {
        credits: {
          orderBy: { createdAt: 'desc' },
        },
        usage: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create new fingerprint if doesn't exist
    if (!fingerprintRecord) {
      const referralCode = generateReferralCode();
      
      fingerprintRecord = await prisma.fingerprint.create({
        data: {
          appId: authContext.app.id,
          fingerprint,
          referralCode,
        },
        include: {
          credits: true,
          usage: true,
        },
      });

      // Log event
      await prisma.eventLog.create({
        data: {
          appId: authContext.app.id,
          event: 'fingerprint.created',
          entityType: 'fingerprint',
          entityId: fingerprintRecord.id,
          metadata: { fingerprint },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent'),
        },
      });
    }

    // Calculate total credits
    const totalCredits = fingerprintRecord.credits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    );

    // Count usage
    const usageCount = fingerprintRecord.usage.length;

    // Get policy from app configuration
    const policy = authContext.app.policyJson as any;

    // Build response
    const response = successResponse({
      fingerprint: fingerprintRecord.fingerprint,
      referralCode: fingerprintRecord.referralCode,
      credits: totalCredits,
      usage: usageCount,
      policy: policy || {
        referralCredits: 5,
        referredCredits: 3,
        nameClaimCredits: 2,
        emailClaimCredits: 2,
        emailVerifyCredits: 5,
        dailyReferralCap: 10,
        actions: {
          default: { creditsRequired: 1 }
        }
      },
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/me:', error);
    return errors.serverError();
  }
}
