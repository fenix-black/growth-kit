import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';
import { isValidEmail, isValidFingerprint } from '@/lib/utils/validation';
import { sendWaitlistConfirmationEmail } from '@/lib/email/send';

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
    const { email, fingerprint, metadata } = body;

    if (!email || !isValidEmail(email)) {
      return errors.badRequest('Invalid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Optional: Link to fingerprint if provided
    let fingerprintRecord = null;
    if (fingerprint && isValidFingerprint(fingerprint)) {
      fingerprintRecord = await prisma.fingerprint.findUnique({
        where: {
          appId_fingerprint: {
            appId: authContext.app.id,
            fingerprint,
          },
        },
      });
    }

    // Check if already on waitlist
    const existing = await prisma.waitlist.findFirst({
      where: {
        appId: authContext.app.id,
        email: normalizedEmail,
        productTag: null, // App-level waitlist
      },
    });

    if (existing) {
      return successResponse({
        joined: false,
        reason: 'already_joined',
        position: existing.position,
        status: existing.status,
      });
    }

    // Get current queue position
    const currentCount = await prisma.waitlist.count({
      where: {
        appId: authContext.app.id,
        status: 'WAITING',
      },
    });

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        appId: authContext.app.id,
        email: normalizedEmail,
        status: 'WAITING',
        position: currentCount + 1,
        metadata: metadata || {},
      },
    });

    // If fingerprint provided, link it in lead record
    if (fingerprintRecord) {
      await prisma.lead.upsert({
        where: {
          appId_email: {
            appId: authContext.app.id,
            email: normalizedEmail,
          },
        },
        create: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord.id,
          email: normalizedEmail,
        },
        update: {
          fingerprintId: fingerprintRecord.id,
        },
      });
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'waitlist.joined',
        entityType: 'waitlist',
        entityId: waitlistEntry.id,
        metadata: { 
          email: normalizedEmail,
          position: waitlistEntry.position,
          fingerprintId: fingerprintRecord?.id,
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Send confirmation email
    console.log('🔄 Attempting to send waitlist confirmation email:', {
      to: normalizedEmail,
      appName: authContext.app.name,
      appDomain: authContext.app.domain,
      position: waitlistEntry.position,
    });
    
    try {
      const emailResult = await sendWaitlistConfirmationEmail(
        authContext.app,
        normalizedEmail,
        {
          position: waitlistEntry.position,
          estimatedWait: '', // You can calculate this based on your invite rate
        }
      );
      
      if (emailResult.success) {
        console.log(`✅ Waitlist confirmation email sent to ${normalizedEmail}`, emailResult.data);
      } else {
        console.error(`❌ Waitlist email failed for ${normalizedEmail}:`, emailResult.error);
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('❌ Exception sending waitlist confirmation email:', emailError);
      // Optionally log to event log
      await prisma.eventLog.create({
        data: {
          appId: authContext.app.id,
          event: 'email.failed',
          entityType: 'waitlist',
          entityId: waitlistEntry.id,
          metadata: { 
            email: normalizedEmail,
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            type: 'waitlist_confirmation',
          },
        },
      });
    }

    // Build response
    const response = successResponse({
      joined: true,
      position: waitlistEntry.position,
      status: waitlistEntry.status,
      message: `You are #${waitlistEntry.position} on the waitlist`,
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/waitlist:', error);
    return errors.serverError();
  }
}
