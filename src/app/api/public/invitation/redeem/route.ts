import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { isInvitationCode, isCodeExpired } from '@/lib/utils/invitationCode';

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
    const { invitationCode } = body;

    if (!invitationCode) {
      return corsErrors.badRequest('Invitation code is required', origin);
    }

    // Validate invitation code format
    if (!isInvitationCode(invitationCode)) {
      return corsErrors.badRequest('Invalid invitation code format', origin);
    }

    // Find the invitation in waitlist
    const waitlistEntry = await prisma.waitlist.findFirst({
      where: {
        appId: app.id,
        invitationCode,
      },
    });

    if (!waitlistEntry) {
      return corsErrors.badRequest('Invalid invitation code', origin);
    }

    // Check if invitation has expired
    if (isCodeExpired(waitlistEntry.codeExpiresAt)) {
      return corsErrors.badRequest('Invitation code has expired', origin);
    }

    // Check if code has already been used by a different fingerprint
    if (waitlistEntry.codeUsedAt && waitlistEntry.fingerprintId !== fingerprint.id) {
      return corsErrors.badRequest('Invitation code has already been used', origin);
    }

    // If already used by same fingerprint, just return success
    if (waitlistEntry.codeUsedAt && waitlistEntry.fingerprintId === fingerprint.id) {
      return withCorsHeaders(
        successResponse({
          redeemed: true,
          alreadyRedeemed: true,
          message: 'Invitation already redeemed by this user',
        }),
        origin,
        app.corsOrigins
      );
    }

    // Process the invitation
    await prisma.$transaction(async (tx) => {
      // Update waitlist entry
      await tx.waitlist.update({
        where: { id: waitlistEntry.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          fingerprintId: fingerprint.id,
          codeUsedAt: new Date(),
          useCount: { increment: 1 },
        },
      });

      // Update or create lead with email from waitlist
      await tx.lead.upsert({
        where: {
          appId_fingerprintId: {
            appId: app.id,
            fingerprintId: fingerprint.id,
          },
        },
        update: {
          email: waitlistEntry.email,
          emailVerified: true, // Invitations auto-verify email
        },
        create: {
          appId: app.id,
          fingerprintId: fingerprint.id,
          email: waitlistEntry.email,
          emailVerified: true,
        },
      });
    });

    // Award invitation credits
    let creditsAwarded = 0;
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        creditsPaused: true,
        policyJson: true,
        initialCreditsPerDay: true,
      },
    });

    if (!appSettings?.creditsPaused) {
      const policy = appSettings?.policyJson as any;
      creditsAwarded = policy?.invitationCredits || appSettings?.initialCreditsPerDay || 5;

      await prisma.credit.create({
        data: {
          fingerprintId: fingerprint.id,
          amount: creditsAwarded,
          reason: 'invitation_accepted',
          metadata: {
            invitationCode,
            waitlistId: waitlistEntry.id,
            email: waitlistEntry.email,
          },
        },
      });
    }

    return withCorsHeaders(
      successResponse({
        redeemed: true,
        creditsAwarded,
        email: waitlistEntry.email,
        waitlistStatus: 'accepted',
        message: 'Invitation successfully redeemed!',
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public invitation redeem error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
