import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimit';
import { withCorsHeaders, handleCorsPreflightResponse } from '@/lib/middleware/cors';
import { successResponse, errors } from '@/lib/utils/response';
import { isValidEmail, isValidFingerprint } from '@/lib/utils/validation';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsOrigins = process.env.CORS_ALLOWLIST?.split(',') || [];
  return handleCorsPreflightResponse(origin, corsOrigins);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return errors.unauthorized();
    }

    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, rateLimits.sensitive);
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
    const existing = await prisma.waitlist.findUnique({
      where: {
        appId_email: {
          appId: authContext.app.id,
          email: normalizedEmail,
        },
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
