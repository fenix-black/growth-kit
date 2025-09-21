import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { generateApiKey, hashApiKey } from '@/lib/security/apiKeys';
import { successResponse, errors } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse request body
    const body = await request.json();
    const { appId, name = 'API Key', scope = 'full', expiresIn } = body;

    if (!appId) {
      return errors.badRequest('Missing required field: appId');
    }

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    // Generate new API key
    const { key, hint } = generateApiKey();
    const hashedKey = await hashApiKey(key);

    // Calculate expiration date if specified
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        appId,
        name,
        keyHint: hint,
        hashedKey,
        scope,
        expiresAt,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        appId,
        event: 'apikey.created',
        entityType: 'apikey',
        entityId: apiKey.id,
        metadata: { scope, expiresAt },
      },
    });

    return successResponse({
      apiKey: {
        id: apiKey.id,
        key, // Only time the full key is shown
        hint,
        scope,
        expiresAt,
      },
      message: 'API key created successfully. Save the key as it won\'t be shown again.',
    }, 201);
  } catch (error) {
    console.error('Error in /v1/admin/apikey POST:', error);
    return errors.serverError();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Get app ID from query params
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return errors.badRequest('Missing required parameter: appId');
    }

    // Get all API keys for the app
    const apiKeys = await prisma.apiKey.findMany({
      where: { appId },
      select: {
        id: true,
        name: true,
        keyHint: true,
        scope: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ apiKeys });
  } catch (error) {
    console.error('Error in /v1/admin/apikey GET:', error);
    return errors.serverError();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Get key ID from query params
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return errors.badRequest('Missing required parameter: keyId');
    }

    // Find the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return errors.notFound();
    }

    // Soft delete (deactivate) the API key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: apiKey.appId,
        event: 'apikey.revoked',
        entityType: 'apikey',
        entityId: apiKey.id,
        metadata: { keyHint: apiKey.keyHint },
      },
    });

    return successResponse({
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error in /v1/admin/apikey DELETE:', error);
    return errors.serverError();
  }
}
