import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import jwt from 'jsonwebtoken';
import { generateReferralCode } from '@/lib/security/hmac';
import { getClientIp } from '@/lib/middleware/rateLimitSafe';
import { getGeolocation, detectBrowser, detectDevice } from '@/lib/utils/geolocation';
import { generateServerFingerprint } from '@/lib/utils/serverFingerprint';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { publicKey, fingerprint, fingerprint2, fingerprint3, context } = body;
    
    // Extract browser context from headers (primary) or request body (fallback)
    const clientIp = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Use context from SDK if available, otherwise detect from headers
    const browser = context?.browser || detectBrowser(userAgent);
    const device = context?.device || detectDevice(userAgent);
    const location = getGeolocation(clientIp, request.headers);

    if (!publicKey || !fingerprint) {
      return corsErrors.badRequest('publicKey and fingerprint are required', origin);
    }

    // Validate public key format
    if (!publicKey.startsWith('pk_')) {
      return corsErrors.badRequest('Invalid public key format', origin);
    }

    // Find app by public key
    const app = await prisma.app.findUnique({
      where: { publicKey },
      select: {
        id: true,
        name: true,
        corsOrigins: true,
        isActive: true,
      },
    });

    if (!app) {
      return corsErrors.unauthorized(origin);
    }

    if (!app.isActive) {
      return corsErrors.unauthorized(origin);
    }

    // Verify origin is allowed for this app (includes default origins)
    if (origin && !isOriginAllowed(origin, app.corsOrigins)) {
      return corsErrors.forbidden(origin);
    }

    // Generate server fingerprint
    const serverFingerprint = generateServerFingerprint(clientIp, request.headers, context);
    
    // Find fingerprint record using priority-based matching (most unique first)
    // 1. Try primary fingerprint (FingerprintJS)
    let fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: app.id,
          fingerprint,
        },
      },
    });
    let matchedBy: string | null = fingerprintRecord ? 'primary' : null;

    // 2. Try fingerprint2 (canvas) if primary didn't match
    if (!fingerprintRecord && fingerprint2) {
      fingerprintRecord = await prisma.fingerprint.findFirst({
        where: {
          appId: app.id,
          fingerprint2: fingerprint2,
        },
      });
      if (fingerprintRecord) matchedBy = 'canvas';
    }

    // 3. Try fingerprint3 (browser signature) if still not found
    if (!fingerprintRecord && fingerprint3) {
      fingerprintRecord = await prisma.fingerprint.findFirst({
        where: {
          appId: app.id,
          fingerprint3: fingerprint3,
        },
      });
      if (fingerprintRecord) matchedBy = 'browser-sig';
    }

    // 4. Try serverFingerprint as last resort (least unique)
    if (!fingerprintRecord) {
      fingerprintRecord = await prisma.fingerprint.findFirst({
        where: {
          appId: app.id,
          serverFingerprint: serverFingerprint,
        },
      });
      if (fingerprintRecord) matchedBy = 'server';
    }

    // If found by fallback method, update all fingerprint values to current
    if (fingerprintRecord && matchedBy !== 'primary') {
      fingerprintRecord = await prisma.fingerprint.update({
        where: { id: fingerprintRecord.id },
        data: { 
          fingerprint,
          fingerprint2: fingerprint2 || fingerprintRecord.fingerprint2,
          fingerprint3: fingerprint3 || fingerprintRecord.fingerprint3,
          serverFingerprint,
          lastActiveAt: new Date(),
        },
      });
      console.log(`[GrowthKit] Matched by ${matchedBy}, updated all fingerprints`);
    }

    if (!fingerprintRecord) {
      const referralCode = generateReferralCode();
      
      fingerprintRecord = await prisma.fingerprint.create({
        data: {
          appId: app.id,
          fingerprint,
          fingerprint2: fingerprint2 || null,
          fingerprint3: fingerprint3 || null,
          serverFingerprint,
          referralCode,
          lastActiveAt: new Date(),
          browser,
          device,
          location: location.city || location.country ? location : undefined,
        },
      });
    } else {
      // Update last active timestamp and browser context if changed
      const shouldUpdateBrowserDevice = 
        fingerprintRecord.browser !== browser || 
        fingerprintRecord.device !== device;
      
      // Always update location if it's missing or if browser/device changed
      const shouldUpdateLocation = 
        !fingerprintRecord.location || 
        shouldUpdateBrowserDevice;
      
      const updateData: any = { 
        lastActiveAt: new Date(),
      };
      
      // Update browser/device if changed
      if (shouldUpdateBrowserDevice) {
        updateData.browser = browser;
        updateData.device = device;
      }
      
      // Update location if missing or context changed
      if (shouldUpdateLocation && (location.city || location.country)) {
        updateData.location = location;
      }
      
      await prisma.fingerprint.update({
        where: { id: fingerprintRecord.id },
        data: updateData,
      });
    }

    // Generate JWT token
    const tokenPayload = {
      appId: app.id,
      fingerprintId: fingerprintRecord.id,
      fingerprint,
      type: 'public',
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30m' }
    );

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    return withCorsHeaders(
      successResponse({
        token,
        expiresAt: expiresAt.toISOString(),
        fingerprintId: fingerprintRecord.id,
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Token generation error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
