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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return corsErrors.badRequest('Valid name is required', origin);
    }

    const trimmedName = name.trim();

    // Find or create lead for this fingerprint
    const lead = await prisma.lead.upsert({
      where: {
        appId_fingerprintId: {
          appId: app.id,
          fingerprintId: fingerprint.id,
        },
      },
      update: {
        name: trimmedName,
      },
      create: {
        appId: app.id,
        fingerprintId: fingerprint.id,
        name: trimmedName,
      },
    });

    // Award credits for name claim (if not already claimed and credits not paused)
    let creditsAwarded = 0;
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        policyJson: true,
        creditsPaused: true,
      },
    });

    // Only award if name wasn't previously set
    const wasNameAlreadyClaimed = !!lead.name && lead.name !== trimmedName;
    
    if (!appSettings?.creditsPaused && !wasNameAlreadyClaimed) {
      const policy = appSettings?.policyJson as any;
      creditsAwarded = policy?.nameClaimCredits;
      
      if (!creditsAwarded) {
        return corsErrors.serverError('App policy not configured properly', origin);
      }

      await prisma.credit.create({
        data: {
          fingerprintId: fingerprint.id,
          amount: creditsAwarded,
          reason: 'name_claim',
          metadata: {
            name: trimmedName,
          },
        },
      });
    }

    // Get total credits
    const totalCredits = await prisma.credit.aggregate({
      where: { fingerprintId: fingerprint.id },
      _sum: { amount: true },
    }).then(result => result._sum.amount || 0);

    return withCorsHeaders(
      successResponse({
        claimed: true,
        name: trimmedName,
        totalCredits,
        creditsAwarded,
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public claim name error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
