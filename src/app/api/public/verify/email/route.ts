import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';

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

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return corsErrors.badRequest('Verification token is required', origin);
    }

    // Find lead with this verification token
    const lead = await prisma.lead.findFirst({
      where: {
        appId: app.id,
        fingerprintId: fingerprint.id,
        verifyToken: token,
        verifyExpiresAt: { gt: new Date() }, // Token not expired
      },
    });

    if (!lead) {
      return withCorsHeaders(
        successResponse({
          verified: false,
          error: 'Invalid or expired verification token',
        }),
        origin,
        app.corsOrigins
      );
    }

    // Mark email as verified
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        emailVerified: true,
        verifyToken: null, // Clear token after use
        verifyExpiresAt: null,
      },
    });

    // Award credits for email verification (if not paused)
    let creditsAwarded = 0;
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        creditsPaused: true,
        policyJson: true,
      },
    });

    if (!appSettings?.creditsPaused) {
      const policy = appSettings?.policyJson as any;
      creditsAwarded = policy?.emailVerifyCredits || 5;

      await prisma.credit.create({
        data: {
          fingerprintId: fingerprint.id,
          amount: creditsAwarded,
          reason: 'email_verification',
          metadata: {
            email: lead.email,
            verificationToken: token,
          },
        },
      });
    }

    return withCorsHeaders(
      successResponse({
        verified: true,
        creditsAwarded,
        totalCredits: await prisma.credit.aggregate({
          where: { fingerprintId: fingerprint.id },
          _sum: { amount: true },
        }).then(result => result._sum.amount || 0),
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public email verification error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
