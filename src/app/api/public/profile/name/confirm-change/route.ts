import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import bcrypt from 'bcrypt';

const MAX_FAILED_ATTEMPTS = 3;

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
    if (origin && !isOriginAllowed(origin, app.corsOrigins)) {
      return corsErrors.forbidden(origin);
    }

    const body = await request.json();
    const { code } = body;

    // Validate code format
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return corsErrors.badRequest('Valid 6-digit code is required', origin);
    }

    // Find pending request
    const changeRequest = await prisma.profileChangeRequest.findUnique({
      where: {
        fingerprintId_appId_type: {
          fingerprintId: fingerprint.id,
          appId: app.id,
          type: 'name',
        },
      },
    });

    if (!changeRequest) {
      return corsErrors.badRequest('No pending name change request found', origin);
    }

    // Check if already used
    if (changeRequest.usedAt) {
      return corsErrors.badRequest('This code has already been used', origin);
    }

    // Check if expired
    if (changeRequest.expiresAt < new Date()) {
      return corsErrors.badRequest('Code has expired. Please request a new one.', origin);
    }

    // Check failed attempts (return locked status for UI to show lock screen)
    if (changeRequest.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return withCorsHeaders(
        successResponse({
          success: false,
          error: 'locked',
          message: 'Too many failed attempts. Please request a new code.',
        }),
        origin,
        app.corsOrigins
      );
    }

    // Verify code
    const isValidCode = await bcrypt.compare(code, changeRequest.code);
    
    if (!isValidCode) {
      // Increment failed attempts
      await prisma.profileChangeRequest.update({
        where: { id: changeRequest.id },
        data: { failedAttempts: { increment: 1 } },
      });

      const remainingAttempts = MAX_FAILED_ATTEMPTS - changeRequest.failedAttempts - 1;

      // Log failed attempt
      await prisma.eventLog.create({
        data: {
          appId: app.id,
          event: 'profile.name_change_failed',
          entityType: 'fingerprint',
          entityId: fingerprint.id,
          metadata: { attemptCount: changeRequest.failedAttempts + 1 },
        },
      });

      if (remainingAttempts <= 0) {
        // Log locked
        await prisma.eventLog.create({
          data: {
            appId: app.id,
            event: 'profile.name_change_locked',
            entityType: 'fingerprint',
            entityId: fingerprint.id,
            metadata: {},
          },
        });

        return withCorsHeaders(
          successResponse({
            success: false,
            error: 'locked',
            message: 'Too many failed attempts. Please request a new code.',
          }),
          origin,
          app.corsOrigins
        );
      }

      return withCorsHeaders(
        successResponse({
          success: false,
          error: 'invalid_code',
          message: `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
          remainingAttempts,
        }),
        origin,
        app.corsOrigins
      );
    }

    // Code is valid - update the name
    const newName = changeRequest.newValue;

    // Get current name for logging
    const currentLead = await prisma.lead.findFirst({
      where: {
        appId: app.id,
        fingerprintId: fingerprint.id,
      },
      select: { name: true },
    });
    const oldName = currentLead?.name || null;

    // Update Lead name
    await prisma.lead.updateMany({
      where: {
        appId: app.id,
        fingerprintId: fingerprint.id,
      },
      data: { name: newName },
    });

    // Update OrgUserAccount if this is a shared app
    if (!(app as any).isolatedAccounts && (fingerprint as any).orgUserAccountId) {
      await (prisma as any).orgUserAccount.update({
        where: { id: (fingerprint as any).orgUserAccountId },
        data: { name: newName, updatedAt: new Date() },
      });
    }

    // Mark request as used
    await prisma.profileChangeRequest.update({
      where: { id: changeRequest.id },
      data: { usedAt: new Date() },
    });

    // Log successful change
    await prisma.eventLog.create({
      data: {
        appId: app.id,
        event: 'profile.name_change_completed',
        entityType: 'fingerprint',
        entityId: fingerprint.id,
        metadata: { oldName, newName },
      },
    });

    return withCorsHeaders(
      successResponse({
        success: true,
        name: newName,
        message: 'Name updated successfully',
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Confirm name change error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}

