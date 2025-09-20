import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse request body
    const body = await request.json();
    const { appId, count = 10 } = body;

    if (!appId) {
      return errors.badRequest('Missing required field: appId');
    }

    if (typeof count !== 'number' || count < 1 || count > 1000) {
      return errors.badRequest('Count must be between 1 and 1000');
    }

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound('App not found');
    }

    // Get next batch of waitlist entries to invite
    const waitlistEntries = await prisma.waitlist.findMany({
      where: {
        appId,
        status: 'WAITING',
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
      take: count,
    });

    if (waitlistEntries.length === 0) {
      return successResponse({
        invited: 0,
        message: 'No waitlist entries to invite',
      });
    }

    // Update status to INVITED for all entries
    const invitedAt = new Date();
    const inviteIds = waitlistEntries.map(entry => entry.id);
    
    await prisma.waitlist.updateMany({
      where: {
        id: { in: inviteIds },
      },
      data: {
        status: 'INVITED',
        invitedAt,
      },
    });

    // Log events for each invitation
    const eventLogs = waitlistEntries.map(entry => ({
      appId,
      event: 'waitlist.invited',
      entityType: 'waitlist',
      entityId: entry.id,
      metadata: {
        email: entry.email,
        position: entry.position,
      },
    }));

    await prisma.eventLog.createMany({
      data: eventLogs,
    });

    // TODO: Send invitation emails via Resend
    // This is a stub for now - will be implemented when email integration is added
    // for (const entry of waitlistEntries) {
    //   await sendInvitationEmail(entry.email, app.name);
    // }

    return successResponse({
      invited: waitlistEntries.length,
      invitedEmails: waitlistEntries.map(e => e.email),
      message: `Successfully invited ${waitlistEntries.length} users`,
    }, 200);
  } catch (error) {
    console.error('Error in /v1/admin/invite-batch:', error);
    return errors.serverError();
  }
}
