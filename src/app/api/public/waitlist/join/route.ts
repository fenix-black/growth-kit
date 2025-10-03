import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { sendWaitlistConfirmationEmail, sendVerificationEmail } from '@/lib/email/send';
import { generateVerificationToken } from '@/lib/security/hmac';
import { buildAppUrl } from '@/lib/utils/url';
import { findProductByTag, isValidProductTag } from '@/lib/types/product-waitlist';

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
    const { email, name, metadata, productTag } = body;

    if (!email) {
      return corsErrors.badRequest('Email is required', origin);
    }

    // Validate productTag if provided
    if (productTag) {
      if (!isValidProductTag(productTag)) {
        return corsErrors.badRequest('Invalid product tag format', origin);
      }
    }

    // Get app data with metadata for product validation
    const appWithWaitlist = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        waitlistEnabled: true,
        waitlistMessages: true,
        metadata: true,
      },
    });

    // For product waitlists
    if (productTag) {
      // Find product configuration
      const product = findProductByTag(appWithWaitlist?.metadata, productTag);
      
      if (!product) {
        return corsErrors.badRequest('Product not found', origin);
      }
      
      if (!product.enabled) {
        return corsErrors.badRequest('This product waitlist is not currently accepting signups', origin);
      }

      // Check if user is already on this product waitlist
      const existingEntry = await prisma.waitlist.findUnique({
        where: {
          appId_email_productTag: {
            appId: app.id,
            email,
            productTag,
          },
        },
      });

      if (existingEntry) {
        return withCorsHeaders(
          successResponse({
            alreadyOnWaitlist: true,
            isOnList: true,
            status: existingEntry.status,
            message: `You are already on the ${product.name} waitlist`,
          }),
          origin,
          app.corsOrigins
        );
      }

      // Create product waitlist entry (no position for products)
      await prisma.waitlist.create({
        data: {
          appId: app.id,
          email,
          productTag,
          status: 'WAITING',
          position: null, // No position tracking for product waitlists
          fingerprintId: fingerprint.id,
          metadata: metadata || null,
        },
      });

      // Create or update lead record
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
        },
        create: {
          appId: app.id,
          fingerprintId: fingerprint.id,
          email,
          name: name || null,
        },
      });

      // No credits for product waitlists
      return withCorsHeaders(
        successResponse({
          joinedWaitlist: true,
          isOnList: true,
          productTag,
          message: product.successMessage || `You've joined the ${product.name} waitlist!`,
        }),
        origin,
        app.corsOrigins
      );
    }

    // App-level waitlist (existing behavior)
    if (!appWithWaitlist?.waitlistEnabled) {
      return corsErrors.badRequest('Waitlist is not enabled for this app', origin);
    }

    // Check if user is already on app-level waitlist
    // Note: Can't use findUnique with null productTag, use findFirst instead
    const existingWaitlistEntry = await prisma.waitlist.findFirst({
      where: {
        appId: app.id,
        email,
        productTag: null,
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

    // Create app-level waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        appId: app.id,
        email,
        productTag: null, // App-level waitlist
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

    // Send emails
    try {
      const appFullData = await prisma.app.findUnique({
        where: { id: app.id },
      });

      if (appFullData) {
        // 1. Send waitlist confirmation email
        await sendWaitlistConfirmationEmail(appFullData, email, {
          position: nextPosition,
          name: name || undefined,
        });
        console.log('✅ Waitlist confirmation email sent to:', email);

        // 2. Also send verification email if email is not already verified
        const leadRecord = await prisma.lead.findFirst({
          where: {
            appId: app.id,
            fingerprintId: fingerprint.id,
          },
        });

        if (leadRecord && !leadRecord.emailVerified) {
          // Generate verification token
          const verifyToken = generateVerificationToken();
          const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Update lead with verification token
          await prisma.lead.update({
            where: { id: leadRecord.id },
            data: {
              verifyToken,
              verifyExpiresAt,
            },
          });

          // Send verification email
          const verificationLink = buildAppUrl(appFullData.domain, `/?verify=${verifyToken}`);
          await sendVerificationEmail(appFullData, email, {
            link: verificationLink,
            name: name || undefined,
          });
          console.log('✅ Email verification email sent to:', email);
        }
      }
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
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
