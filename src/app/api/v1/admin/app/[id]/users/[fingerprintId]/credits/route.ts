import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fingerprintId: string }> }
) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    const { id: appId, fingerprintId } = await params;
    const body = await request.json();
    const { amount, reason, metadata } = body;

    // Validate input
    if (typeof amount !== 'number' || amount === 0) {
      return errors.badRequest('Invalid credit amount');
    }

    if (!reason || typeof reason !== 'string') {
      return errors.badRequest('Reason is required');
    }

    // Verify fingerprint belongs to app
    const fingerprint = await prisma.fingerprint.findFirst({
      where: {
        id: fingerprintId,
        appId,
      },
    });

    if (!fingerprint) {
      return errors.notFound();
    }

    // Create credit transaction
    const credit = await prisma.credit.create({
      data: {
        fingerprintId,
        amount,
        reason: `admin_adjustment:${reason}`,
        metadata: {
          ...metadata,
          adjustedBy: 'admin',
          adjustedAt: new Date().toISOString(),
        },
      },
    });

    // Calculate new balance
    const credits = await prisma.credit.aggregate({
      where: { fingerprintId },
      _sum: { amount: true },
    });

    const newBalance = credits._sum.amount || 0;

    // Log event
    await prisma.eventLog.create({
      data: {
        appId,
        event: 'admin.credit_adjustment',
        entityType: 'fingerprint',
        entityId: fingerprintId,
        metadata: {
          amount,
          reason,
          newBalance,
          creditId: credit.id,
        },
      },
    });

    return successResponse({
      credit: {
        id: credit.id,
        amount: credit.amount,
        reason: credit.reason,
        createdAt: credit.createdAt,
      },
      newBalance,
    });
  } catch (error) {
    console.error('Error in /v1/admin/app/[id]/users/[fingerprintId]/credits POST:', error);
    return errors.serverError();
  }
}
