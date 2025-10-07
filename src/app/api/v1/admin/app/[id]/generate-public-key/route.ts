import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { generatePublicKey } from '@/lib/security/apiKeys';
import { successResponse, errors } from '@/lib/utils/response';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    const { id: appId } = await params;

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    // Check if app already has a public key
    if (app.publicKey) {
      return successResponse({
        message: 'App already has a public key',
        publicKey: app.publicKey,
      });
    }

    // Generate new public key
    const publicKey = generatePublicKey();

    // Update app with public key
    const updatedApp = await prisma.app.update({
      where: { id: appId },
      data: { publicKey },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        appId,
        event: 'publickey.generated',
        entityType: 'app',
        entityId: appId,
        metadata: {},
      },
    });

    return successResponse({
      publicKey,
      message: 'Public key generated successfully',
    }, 201);
  } catch (error) {
    console.error('Error in /v1/admin/app/[id]/generate-public-key POST:', error);
    return errors.serverError();
  }
}
