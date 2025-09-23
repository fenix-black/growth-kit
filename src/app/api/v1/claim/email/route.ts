import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateVerificationToken } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimit';
import { withCorsHeaders, handleCorsPreflightResponse } from '@/lib/middleware/cors';
import { successResponse, errors } from '@/lib/utils/response';
import { isValidFingerprint, isValidEmail } from '@/lib/utils/validation';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Try to get app context to use its CORS origins
  const authContext = await verifyAppAuth(request.headers);
  
  // Use app's CORS origins if available, otherwise fall back to env variable
  const corsOrigins = authContext?.app.corsOrigins || 
    process.env.CORS_ALLOWLIST?.split(',') || [];
    
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
    const rateLimitCheck = await checkRateLimit(clientIp, rateLimits.sensitive);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Parse request body
    const body = await request.json();
    const { fingerprint, email } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    if (!email || !isValidEmail(email)) {
      return errors.badRequest('Invalid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get fingerprint record
    const fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: authContext.app.id,
          fingerprint,
        },
      },
    });

    if (!fingerprintRecord) {
      return errors.badRequest('Fingerprint not found. Call /v1/me first');
    }

    // Check if email already claimed for this fingerprint
    const existingLead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        email: normalizedEmail,
      },
    });

    if (existingLead) {
      // If already verified, don't send new verification
      if (existingLead.emailVerified) {
        return successResponse({
          claimed: false,
          reason: 'already_verified',
          message: 'Email already verified for this fingerprint',
        });
      }

      // Resend verification if not verified
      const verifyToken = generateVerificationToken();
      const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          verifyToken,
          verifyExpiresAt,
        },
      });

      // TODO: Send verification email via Resend
      console.log('Would send verification email to:', normalizedEmail, 'with token:', verifyToken);

      return successResponse({
        claimed: true,
        verificationSent: true,
        message: 'Verification email resent',
      });
    }

    // Check if email is already used by another fingerprint
    const emailInUse = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        email: normalizedEmail,
        fingerprintId: { not: fingerprintRecord.id },
      },
    });

    if (emailInUse) {
      return errors.badRequest('Email already associated with another user');
    }

    // Create new lead record with email
    const verifyToken = generateVerificationToken();
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const lead = await prisma.lead.create({
      data: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        email: normalizedEmail,
        emailVerified: false,
        verifyToken,
        verifyExpiresAt,
      },
    });

    // Award initial credits for email claim
    const policy = authContext.app.policyJson as any;
    const emailCredits = policy?.emailClaimCredits || 2;

    await prisma.credit.create({
      data: {
        fingerprintId: fingerprintRecord.id,
        amount: emailCredits,
        reason: 'email_claim',
        metadata: { email: normalizedEmail },
      },
    });

    // TODO: Send verification email via Resend
    console.log('Would send verification email to:', normalizedEmail, 'with token:', verifyToken);

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'lead.email_claimed',
        entityType: 'lead',
        entityId: lead.id,
        metadata: { fingerprintId: fingerprintRecord.id, email: normalizedEmail },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Calculate new credit balance
    const credits = await prisma.credit.aggregate({
      where: { fingerprintId: fingerprintRecord.id },
      _sum: { amount: true },
    });

    // Build response
    const response = successResponse({
      claimed: true,
      verificationSent: true,
      creditsAwarded: emailCredits,
      totalCredits: credits._sum.amount || 0,
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/claim/email:', error);
    return errors.serverError();
  }
}
