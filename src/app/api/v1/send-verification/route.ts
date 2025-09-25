import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';import { isValidFingerprint, isValidEmail } from '@/lib/utils/validation';
import { sendVerificationEmail } from '@/lib/email/send';
import crypto from 'crypto';

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
    const { fingerprint, email, name } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    if (!email || !isValidEmail(email)) {
      return errors.badRequest('Invalid or missing email');
    }

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
      return errors.badRequest('Fingerprint not found');
    }

    // Check if email is already verified for this fingerprint
    const existingLead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        email: email.toLowerCase(),
        emailVerified: true,
      },
    });

    if (existingLead) {
      return successResponse({
        sent: false,
        reason: 'already_verified',
        message: 'Email already verified for this user',
      });
    }

    // Generate verification token (6-digit code or random token)
    const policy = authContext.app.policyJson as any;
    const useCode = policy?.emailVerificationType === 'code';
    const verifyToken = useCode 
      ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
      : crypto.randomBytes(32).toString('hex'); // Random token

    // Create or update lead
    const lead = await prisma.lead.upsert({
      where: {
        appId_email: {
          appId: authContext.app.id,
          email: email.toLowerCase(),
        },
      },
      create: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        email: email.toLowerCase(),
        name: name || null,
        verifyToken,
        verifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        emailVerified: false,
      },
      update: {
        name: name || undefined,
        verifyToken,
        verifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Get app details for email
    const app = await prisma.app.findUniqueOrThrow({
      where: { id: authContext.app.id },
    });

    // Send verification email
    const emailData = useCode
      ? { code: verifyToken, name: name || undefined }
      : { 
          link: `${app.domain}/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`,
          name: name || undefined
        };

    const emailResult = await sendVerificationEmail(app, email, emailData);

    if (!emailResult.success) {
      // Delete the lead if email failed to send
      await prisma.lead.delete({
        where: { id: lead.id },
      });
      
      return errors.serverError('Failed to send verification email');
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'verification.sent',
        entityType: 'lead',
        entityId: lead.id,
        metadata: { 
          fingerprintId: fingerprintRecord.id, 
          email: lead.email,
          type: useCode ? 'code' : 'link'
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Build response
    const response = successResponse({
      sent: true,
      type: useCode ? 'code' : 'link',
      message: `Verification ${useCode ? 'code' : 'link'} sent to ${email}`,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/send-verification:', error);
    return errors.serverError();
  }
}
