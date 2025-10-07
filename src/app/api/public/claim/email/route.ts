import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import { sendVerificationEmail } from '@/lib/email/send';
import { generateVerificationToken } from '@/lib/security/hmac';
import { buildAppUrl } from '@/lib/utils/url';

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
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return corsErrors.badRequest('Valid email is required', origin);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already used by another fingerprint
    const emailInUse = await prisma.lead.findFirst({
      where: {
        appId: app.id,
        email: normalizedEmail,
        fingerprintId: { not: fingerprint.id },
      },
    });

    if (emailInUse) {
      return corsErrors.badRequest('Email already associated with another user', origin);
    }

    // Generate verification token
    const verifyToken = generateVerificationToken();
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Find or create lead
    const lead = await prisma.lead.upsert({
      where: {
        appId_fingerprintId: {
          appId: app.id,
          fingerprintId: fingerprint.id,
        },
      },
      update: {
        email: normalizedEmail,
        emailVerified: false,
        verifyToken,
        verifyExpiresAt,
      },
      create: {
        appId: app.id,
        fingerprintId: fingerprint.id,
        email: normalizedEmail,
        emailVerified: false,
        verifyToken,
        verifyExpiresAt,
      },
    });

    // Award credits for email claim (if not already claimed and credits not paused)
    let creditsAwarded = 0;
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        domain: true,
        policyJson: true,
        creditsPaused: true,
      },
    });

    const wasEmailAlreadyClaimed = !!lead.email && lead.email !== normalizedEmail;
    
    if (!appSettings?.creditsPaused && !wasEmailAlreadyClaimed) {
      const policy = appSettings?.policyJson as any;
      creditsAwarded = policy?.emailClaimCredits;
      
      if (!creditsAwarded) {
        return corsErrors.serverError('App policy not configured properly', origin);
      }

      await prisma.credit.create({
        data: {
          fingerprintId: fingerprint.id,
          amount: creditsAwarded,
          reason: 'email_claim',
          metadata: { email: normalizedEmail },
        },
      });
    }

    // Send verification email
    const verificationLink = appSettings?.domain ? 
      buildAppUrl(appSettings.domain, `/?verify=${verifyToken}`) : 
      '';
    
    try {
      await sendVerificationEmail(
        { ...app, domain: appSettings?.domain || app.id } as any,
        normalizedEmail,
        {
          link: verificationLink,
          name: lead.name || undefined,
        }
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    // Get total credits
    const totalCredits = await prisma.credit.aggregate({
      where: { fingerprintId: fingerprint.id },
      _sum: { amount: true },
    }).then(result => result._sum.amount || 0);

    return withCorsHeaders(
      successResponse({
        claimed: true,
        email: normalizedEmail,
        totalCredits,
        creditsAwarded,
        verificationSent: true,
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public claim email error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
