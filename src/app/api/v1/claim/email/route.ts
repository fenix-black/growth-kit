import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateVerificationToken } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';
import { isValidFingerprint, isValidEmail } from '@/lib/utils/validation';
import { sendVerificationEmail } from '@/lib/email/send';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, 'sensitive');
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

      // Send verification email
      const verificationLink = `${authContext.app.domain}/verify?token=${verifyToken}&email=${encodeURIComponent(normalizedEmail)}`;
      
      try {
        await sendVerificationEmail(authContext.app, normalizedEmail, {
          link: verificationLink,
          name: existingLead.name || undefined,
        });
        console.log('✅ Verification email sent to:', normalizedEmail);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Don't fail the request if email sending fails
      }

      // Calculate current credit balance
      const credits = await prisma.credit.aggregate({
        where: { fingerprintId: fingerprintRecord.id },
        _sum: { amount: true },
      });

      return successResponse({
        claimed: true,
        verificationSent: true,
        message: 'Verification email resent',
        totalCredits: credits._sum.amount || 0,
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

    // Send verification email
    const verificationLink = `${authContext.app.domain}/verify?token=${verifyToken}&email=${encodeURIComponent(normalizedEmail)}`;
    
    try {
      await sendVerificationEmail(authContext.app, normalizedEmail, {
        link: verificationLink,
        name: lead.name || undefined,
      });
      console.log('✅ Verification email sent to:', normalizedEmail);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail the request if email sending fails
    }

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
