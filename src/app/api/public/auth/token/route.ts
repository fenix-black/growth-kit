import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';
import jwt from 'jsonwebtoken';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { publicKey, fingerprint } = body;

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

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    // Find or create fingerprint record
    let fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: app.id,
          fingerprint,
        },
      },
    });

    if (!fingerprintRecord) {
      fingerprintRecord = await prisma.fingerprint.create({
        data: {
          appId: app.id,
          fingerprint,
          lastActiveAt: new Date(),
        },
      });
    } else {
      // Update last active timestamp
      await prisma.fingerprint.update({
        where: { id: fingerprintRecord.id },
        data: { lastActiveAt: new Date() },
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
