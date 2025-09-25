import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';import { isValidFingerprint, sanitizeInput } from '@/lib/utils/validation';

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
    const { fingerprint, name } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errors.badRequest('Invalid or missing name');
    }

    const sanitizedName = sanitizeInput(name);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return errors.badRequest('Name must be between 2 and 100 characters');
    }

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

    // Check if name already claimed
    const existingLead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
        name: { not: null },
      },
    });

    if (existingLead) {
      return successResponse({
        claimed: false,
        reason: 'already_claimed',
        message: 'Name already claimed for this fingerprint',
      });
    }

    // Find existing lead by fingerprintId
    const existingLeadToUpdate = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord.id,
      },
    });

    let lead;
    if (existingLeadToUpdate) {
      // Update existing lead
      lead = await prisma.lead.update({
        where: { id: existingLeadToUpdate.id },
        data: { name: sanitizedName },
      });
    } else {
      // Create new lead if none exists
      lead = await prisma.lead.create({
        data: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord.id,
          name: sanitizedName,
        },
      });
    }

    // Award credits for name claim
    const policy = authContext.app.policyJson as any;
    const nameCredits = policy?.nameClaimCredits || 2;

    await prisma.credit.create({
      data: {
        fingerprintId: fingerprintRecord.id,
        amount: nameCredits,
        reason: 'name_claim',
        metadata: { name: sanitizedName },
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'lead.name_claimed',
        entityType: 'lead',
        entityId: lead.id,
        metadata: { fingerprintId: fingerprintRecord.id },
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
      name: sanitizedName,
      creditsAwarded: nameCredits,
      totalCredits: credits._sum.amount || 0,
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/claim/name:', error);
    return errors.serverError();
  }
}
