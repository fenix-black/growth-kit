import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';
import { isValidFingerprint, isValidEmail } from '@/lib/utils/validation';

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
    const { fingerprint, token, email } = body;

    if (!token || typeof token !== 'string') {
      return errors.badRequest('Invalid or missing verification token');
    }

    // Find lead by token only (token is unique across the entire system)
    const lead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        verifyToken: token,
      },
      include: {
        fingerprint: true,
      },
    });

    if (!lead || !lead.fingerprintId) {
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

    // Check if this fingerprint has other verified emails that should be replaced
    const otherVerifiedEmails = await prisma.lead.findMany({
      where: {
        appId: authContext.app.id,
        fingerprintId: lead.fingerprintId,
        emailVerified: true,
        id: { not: lead.id },
      },
    });

    // Use transaction to handle email replacement atomically
    await prisma.$transaction(async (tx) => {
      // Mark email as verified
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          emailVerified: true,
          verifyToken: null,
          verifyExpiresAt: null,
        },
      });

      // If user had other verified emails, invalidate them (keeping only the newest verified one)
      if (otherVerifiedEmails.length > 0) {
        await tx.lead.updateMany({
          where: {
            appId: authContext.app.id,
            fingerprintId: lead.fingerprintId,
            emailVerified: true,
            id: { not: lead.id },
          },
          data: {
            emailVerified: false,
            verifyToken: null,
            verifyExpiresAt: null,
          },
        });

        console.log(`📧 Replaced ${otherVerifiedEmails.length} previous verified email(s) for fingerprint ${lead.fingerprintId}`);
      }
    });

    // Award verification credits (only if credits are not paused)
    let verifyCredits = 0;
    if (!authContext.app.creditsPaused) {
      const policy = authContext.app.policyJson as any;
      verifyCredits = policy?.emailVerifyCredits || 5;

      await prisma.credit.create({
        data: {
          fingerprintId: lead.fingerprintId,
          amount: verifyCredits,
          reason: 'email_verify',
          metadata: { email: lead.email },
        },
      });
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'lead.email_verified',
        entityType: 'lead',
        entityId: lead.id,
        metadata: { fingerprintId: lead.fingerprintId, email: lead.email },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Calculate new credit balance
    const credits = await prisma.credit.aggregate({
      where: { fingerprintId: lead.fingerprintId },
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
