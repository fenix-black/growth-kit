import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';import { isValidFingerprint } from '@/lib/utils/validation';

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
    const { fingerprint, token } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    if (!token || typeof token !== 'string') {
      return errors.badRequest('Invalid or missing verification token');
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

    // Find lead with this verification token
    const lead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        verifyToken: token,
      },
    });

    if (!lead) {
      return errors.badRequest('Invalid verification token');
    }

    // Check if token is expired
    if (lead.verifyExpiresAt && lead.verifyExpiresAt < new Date()) {
      return errors.badRequest('Verification token has expired');
    }

    // Check if already verified
    if (lead.emailVerified) {
      return successResponse({
        verified: false,
        reason: 'already_verified',
        message: 'Email already verified',
      });
    }

    // Mark email as verified
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyExpiresAt: null,
      },
    });

    // Award verification credits
    const policy = authContext.app.policyJson as any;
    const verifyCredits = policy?.emailVerifyCredits || 5;

    await prisma.credit.create({
      data: {
        fingerprintId: fingerprintRecord.id,
        amount: verifyCredits,
        reason: 'email_verify',
        metadata: { email: lead.email },
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'lead.email_verified',
        entityType: 'lead',
        entityId: lead.id,
        metadata: { fingerprintId: fingerprintRecord.id, email: lead.email },
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
      verified: true,
      creditsAwarded: verifyCredits,
      totalCredits: credits._sum.amount || 0,
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/verify/email:', error);
    return errors.serverError();
  }
}
