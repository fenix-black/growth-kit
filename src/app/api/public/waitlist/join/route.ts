import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { sendWaitlistConfirmationEmail } from '@/lib/email/send';

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
    const { email, name, metadata } = body;

    if (!email) {
      return corsErrors.badRequest('Email is required', origin);
    }

    // Check if app has waitlist enabled
    const appWithWaitlist = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        waitlistEnabled: true,
        waitlistMessages: true,
      },
    });

    if (!appWithWaitlist?.waitlistEnabled) {
      return corsErrors.badRequest('Waitlist is not enabled for this app', origin);
    }

    // Check if user is already on waitlist
    const existingWaitlistEntry = await prisma.waitlist.findUnique({
      where: {
        appId_email: {
          appId: app.id,
          email,
        },
      },
    });

    if (existingWaitlistEntry) {
      return withCorsHeaders(
        successResponse({
          alreadyOnWaitlist: true,
          position: existingWaitlistEntry.position,
          status: existingWaitlistEntry.status,
          message: 'You are already on the waitlist',
        }),
        origin,
        app.corsOrigins
      );
    }

    // Get next position
    const lastEntry = await prisma.waitlist.findFirst({
      where: { appId: app.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const nextPosition = (lastEntry?.position || 0) + 1;

    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        appId: app.id,
        email,
        status: 'WAITING',
        position: nextPosition,
        fingerprintId: fingerprint.id,
        metadata: metadata || null,
      },
    });

    // Also create or update lead record
    await prisma.lead.upsert({
      where: {
        appId_fingerprintId: {
          appId: app.id,
          fingerprintId: fingerprint.id,
        },
      },
      update: {
        email,
        name: name || undefined,
        metadata: metadata || undefined,
      },
      create: {
        appId: app.id,
        fingerprintId: fingerprint.id,
        email,
        name: name || null,
        metadata: metadata || null,
      },
    });

    // Award credits for joining waitlist (if configured)
    let creditsAwarded = 0;
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        policyJson: true,
        creditsPaused: true,
      },
    });

    if (!appSettings?.creditsPaused) {
      const policy = appSettings?.policyJson as any;
      creditsAwarded = policy?.waitlistJoinCredits || 0;

      if (creditsAwarded > 0) {
        await prisma.credit.create({
          data: {
            fingerprintId: fingerprint.id,
            amount: creditsAwarded,
            reason: 'waitlist_join',
            metadata: {
              waitlistId: waitlistEntry.id,
            },
          },
        });
      }
    }

    // Send confirmation email
    try {
      const appFullData = await prisma.app.findUnique({
        where: { id: app.id },
      });

      if (appFullData) {
        await sendWaitlistConfirmationEmail(appFullData, email, {
          position: nextPosition,
          name: name || undefined,
        });
        
        console.log('✅ Waitlist confirmation email sent to:', email);
      }
    } catch (emailError) {
      console.error('Failed to send waitlist confirmation email:', emailError);
      // Continue even if email fails
    }

    return withCorsHeaders(
      successResponse({
        joinedWaitlist: true,
        joined: true,
        position: nextPosition,
        creditsAwarded,
        messages: appWithWaitlist.waitlistMessages || [],
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public waitlist join error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
