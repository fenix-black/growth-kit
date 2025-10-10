import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateVerificationToken } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';
import { buildAppUrl } from '@/lib/utils/url';
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

    // Verify origin is allowed for this app (includes default origins)
    if (origin && !isOriginAllowed(origin, authContext.app.corsOrigins)) {
      return corsErrors.forbidden(origin);
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

    // Check if this fingerprint has claimed any other email
    const existingEmailLead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        email: { not: normalizedEmail },
      },
    });

    if (existingLead) {
      // If already verified, don't send new verification
      if (existingLead.emailVerified) {
      return successResponse({
        claimed: false,
        email: existingLead.email,
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

      // Update OrgUserAccount if this is a shared app
      if (!(authContext.app as any).isolatedAccounts && (fingerprintRecord as any).orgUserAccountId) {
        await (prisma as any).orgUserAccount.update({
          where: { id: (fingerprintRecord as any).orgUserAccountId },
          data: { updatedAt: new Date() },
        });
      }

      // Send verification email
      const verificationLink = `${authContext.app.domain}/verify?token=${verifyToken}`;
      
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
        email: email,
        verificationSent: true,
        message: 'Verification email resent',
        totalCredits: credits._sum.amount || 0,
      });
    }

    // Handle email change scenario
    if (existingEmailLead) {
      // This fingerprint is trying to change their email
      
      // Check if new email is already used by another fingerprint
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

      // Email change logic:
      // - If previous email was NOT verified: replace it immediately
      // - If previous email was verified: create new lead but don't award credits
      
      if (!existingEmailLead.emailVerified) {
        // Replace unverified email immediately
        const verifyToken = generateVerificationToken();
        const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.lead.update({
          where: { id: existingEmailLead.id },
          data: {
            email: normalizedEmail,
            verifyToken,
            verifyExpiresAt,
            emailVerified: false,
          },
        });

        // Update OrgUserAccount if this is a shared app
        if (!(authContext.app as any).isolatedAccounts && (fingerprintRecord as any).orgUserAccountId) {
          await (prisma as any).orgUserAccount.update({
            where: { id: (fingerprintRecord as any).orgUserAccountId },
            data: { email: normalizedEmail, emailVerified: false, updatedAt: new Date() },
          });
        }

        // Send verification email for new email
        const verificationLink = `${authContext.app.domain}/verify?token=${verifyToken}`;
        
        try {
          await sendVerificationEmail(authContext.app, normalizedEmail, {
            link: verificationLink,
            name: existingEmailLead.name || undefined,
          });
          console.log('✅ Email change verification sent to:', normalizedEmail);
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', emailError);
        }

        // Calculate current credit balance (no new credits awarded)
        const credits = await prisma.credit.aggregate({
          where: { fingerprintId: fingerprintRecord.id },
          _sum: { amount: true },
        });

        return successResponse({
          claimed: true,
          email: email,
          verificationSent: true,
          message: 'Email changed. Verification sent to new email.',
          totalCredits: credits._sum.amount || 0,
        });
      } else {
        // Previous email was verified, update same lead with new email pending verification
        const verifyToken = generateVerificationToken();
        const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.lead.update({
          where: { id: existingEmailLead.id },
          data: {
            email: normalizedEmail,
            emailVerified: false,
            verifyToken,
            verifyExpiresAt,
          },
        });

        // Send verification email
        const verificationLink = `${authContext.app.domain}/verify?token=${verifyToken}`;
        
        try {
          await sendVerificationEmail(authContext.app, normalizedEmail, {
            link: verificationLink,
            name: existingEmailLead.name || undefined,
          });
          console.log('✅ Email change verification sent to:', normalizedEmail);
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', emailError);
        }

        // Calculate current credit balance (no new credits awarded)
        const credits = await prisma.credit.aggregate({
          where: { fingerprintId: fingerprintRecord.id },
          _sum: { amount: true },
        });

        return successResponse({
          claimed: true,
          email: email,
          verificationSent: true,
          message: 'Email change requested. Verify new email to complete the change.',
          totalCredits: credits._sum.amount || 0,
        });
      }
    }

    // Check if email is already used by another fingerprint (for new users)
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

    // Find existing lead - it should already exist from /v1/me
    const lead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
      },
    });

    if (!lead) {
      return errors.badRequest('No lead record found. Call /v1/me first to initialize.');
    }

    // Generate verification token
    const verifyToken = generateVerificationToken();
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update existing lead with email
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        email: normalizedEmail,
        emailVerified: false,
        verifyToken,
        verifyExpiresAt,
      },
    });

    // Update OrgUserAccount if this is a shared app
    if (!(authContext.app as any).isolatedAccounts && (fingerprintRecord as any).orgUserAccountId) {
      await (prisma as any).orgUserAccount.update({
        where: { id: (fingerprintRecord as any).orgUserAccountId },
        data: { email: normalizedEmail, emailVerified: false, updatedAt: new Date() },
      });
    }

    // Award initial credits for email claim
    // Award credits for email claim (only if credits are not paused)
    let emailCredits = 0;
    if (!authContext.app.creditsPaused) {
      const policy = authContext.app.policyJson as any;
      emailCredits = policy?.emailClaimCredits || 2;

      await prisma.credit.create({
        data: {
          fingerprintId: fingerprintRecord.id,
          amount: emailCredits,
          reason: 'email_claim',
          metadata: { email: normalizedEmail },
        },
      });
    }

    // Send verification email with query parameter (no middleware needed)
    const verificationLink = buildAppUrl(authContext.app.domain, `/?verify=${verifyToken}`);
    
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
      email: email,
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
