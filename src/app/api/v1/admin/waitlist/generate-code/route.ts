import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { generateInvitationCode } from '@/lib/utils/invitationCode';

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errors.unauthorized();
    }

    const token = authHeader.substring(7);
    const expectedToken = process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025';
    
    if (token !== expectedToken) {
      return errors.forbidden();
    }

    const body = await request.json();
    const { appId, email, expiresInDays = 7, maxUses = 1, customMessage } = body;

    if (!appId || !email) {
      return errors.badRequest('appId and email are required');
    }

    // Check if email is already on waitlist
    let waitlistEntry = await prisma.waitlist.findUnique({
      where: {
        appId_email: {
          appId,
          email,
        },
      },
    });

    // If not on waitlist, add them
    if (!waitlistEntry) {
      const lastInQueue = await prisma.waitlist.findFirst({
        where: {
          appId,
          status: 'WAITING',
        },
        orderBy: {
          position: 'desc',
        },
        select: {
          position: true,
        },
      });

      const position = (lastInQueue?.position || 0) + 1;

      waitlistEntry = await prisma.waitlist.create({
        data: {
          appId,
          email,
          position,
          status: 'WAITING',
        },
      });
    }

    // Generate invitation code
    const code = generateInvitationCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Update waitlist entry with invitation code
    const updatedEntry = await prisma.waitlist.update({
      where: {
        id: waitlistEntry.id,
      },
      data: {
        invitationCode: code,
        codeExpiresAt: expiresAt,
        maxUses,
        useCount: 0,
        invitedVia: 'manual',
        invitedAt: new Date(),
        status: 'INVITED',
        metadata: waitlistEntry.metadata || customMessage ? {
          ...(waitlistEntry.metadata as any || {}),
          customMessage,
        } : waitlistEntry.metadata,
      },
    });

    // Log the invitation
    await prisma.eventLog.create({
      data: {
        appId,
        event: 'invitation_generated',
        entityType: 'waitlist',
        entityId: waitlistEntry.id,
        metadata: {
          email,
          code,
          expiresAt,
          maxUses,
        },
      },
    });

    return successResponse({
      entry: updatedEntry,
      code,
      expiresAt,
    });
  } catch (error) {
    console.error('Error generating invitation code:', error);
    return errors.serverError();
  }
}
