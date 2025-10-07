import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';
import { isValidFingerprint } from '@/lib/utils/validation';
import { isInvitationCode, isCodeExpired } from '@/lib/utils/invitationCode';
import { getGeolocation, detectBrowser, detectDevice } from '@/lib/utils/geolocation';

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

    // Verify origin is allowed for this app (includes default origins)
    if (origin && !isOriginAllowed(origin, authContext.app.corsOrigins)) {
      return corsErrors.forbidden(origin);
    }

    // Rate limiting by IP
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, 'api');
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Parse request body
    const body = await request.json();
    const { invitationCode, fingerprint } = body;

    // Validate invitation code format
    if (!invitationCode || !isInvitationCode(invitationCode)) {
      return errors.badRequest('Invalid invitation code format');
    }

    // Validate fingerprint
    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    // Find the invitation in the waitlist
    const waitlistEntry = await prisma.waitlist.findFirst({
      where: {
        appId: authContext.app.id,
        invitationCode,
      },
    });

    if (!waitlistEntry) {
      return errors.notFound();
    }

    // Check if code has expired
    if (isCodeExpired(waitlistEntry.codeExpiresAt)) {
      return errors.badRequest('Invitation code has expired');
    }

    // Check if code has already been used
    if (waitlistEntry.codeUsedAt) {
      // If already used by the same fingerprint, allow access but don't grant credits again
      if (waitlistEntry.fingerprintId === fingerprint) {
        const response = successResponse({
          success: true,
          alreadyRedeemed: true,
          status: waitlistEntry.status,
          email: waitlistEntry.email,
        });

        return withCorsHeaders(
          response,
          origin,
          authContext.app.corsOrigins
        );
      } else {
        // Code was used by a different fingerprint
        return errors.badRequest('Invitation code has already been used');
      }
    }

    // Check if max uses has been reached
    if (waitlistEntry.useCount >= waitlistEntry.maxUses) {
      return errors.badRequest('Invitation code has reached maximum uses');
    }

    // Get or create fingerprint record
    let fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: authContext.app.id,
          fingerprint,
        },
      },
    });

    if (!fingerprintRecord) {
      // Generate unique referral code for new fingerprint
      const { customAlphabet } = await import('nanoid');
      const generateCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
      let referralCode: string;
      let isUnique = false;
      
      while (!isUnique) {
        referralCode = generateCode();
        const existing = await prisma.fingerprint.findUnique({
          where: { referralCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      // Extract browser context for tracking
      const clientIp = getClientIp(request.headers);
      const userAgent = request.headers.get('user-agent') || '';
      const browser = detectBrowser(userAgent);
      const device = detectDevice(userAgent);
      const location = getGeolocation(clientIp, request.headers);
      
      // Create fingerprint record
      fingerprintRecord = await prisma.fingerprint.create({
        data: {
          appId: authContext.app.id,
          fingerprint,
          referralCode: referralCode!,
          browser,
          device,
          location: location.city || location.country ? location : undefined,
        },
      });
    }

    // Begin transaction to redeem the code
    const result = await prisma.$transaction(async (tx) => {
      // Update waitlist entry
      const updatedWaitlist = await tx.waitlist.update({
        where: { id: waitlistEntry.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          fingerprintId: fingerprintRecord!.id,
          codeUsedAt: new Date(),
          useCount: { increment: 1 },
          invitedVia: waitlistEntry.invitedVia || 'invitation_code',
        },
      });

      // Grant invitation credits to the user
      const creditsToGrant = authContext.app.masterReferralCredits || 10;
      
      await tx.credit.create({
        data: {
          fingerprintId: fingerprintRecord!.id,
          amount: creditsToGrant,
          reason: 'invitation',
          metadata: {
            invitationCode,
            waitlistId: waitlistEntry.id,
          },
        },
      });

      // Create or update lead with email
      await tx.lead.upsert({
        where: {
          appId_email: {
            appId: authContext.app.id,
            email: waitlistEntry.email,
          },
        },
        update: {
          fingerprintId: fingerprintRecord!.id,
          emailVerified: true, // Invitation implies verified email
        },
        create: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord!.id,
          email: waitlistEntry.email,
          emailVerified: true,
        },
      });

      // Log the redemption event
      await tx.eventLog.create({
        data: {
          appId: authContext.app.id,
          event: 'invitation.redeemed',
          entityType: 'waitlist',
          entityId: waitlistEntry.id,
          metadata: {
            invitationCode,
            fingerprintId: fingerprintRecord!.id,
            email: waitlistEntry.email,
            creditsGranted: creditsToGrant,
          },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent'),
        },
      });

      // Get updated credit balance
      const credits = await tx.credit.findMany({
        where: { fingerprintId: fingerprintRecord!.id },
      });

      const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);

      // Get usage count
      const usageCount = await tx.usage.count({
        where: { fingerprintId: fingerprintRecord!.id },
      });

      return {
        waitlist: updatedWaitlist,
        credits: totalCredits,
        usageCount,
        referralCode: fingerprintRecord!.referralCode,
      };
    });

    // Build response
    const response = successResponse({
      success: true,
      status: result.waitlist.status,
      email: result.waitlist.email,
      credits: result.credits,
      usageCount: result.usageCount,
      referralCode: result.referralCode,
      creditsGranted: authContext.app.masterReferralCredits || 10,
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/waitlist/redeem:', error);
    return errors.serverError();
  }
}
