import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';
import { sendInvitationEmail } from '@/lib/email/send';
import { generateInvitationCode } from '@/lib/utils/invitationCode';

export async function POST(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse request body
    const body = await request.json();
    const { appId, count = 10, waitlistIds } = body;

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

    let waitlistEntries;

    // If specific IDs provided, use those
    if (waitlistIds && Array.isArray(waitlistIds) && waitlistIds.length > 0) {
      waitlistEntries = await prisma.waitlist.findMany({
        where: {
          id: { in: waitlistIds },
          appId,
          status: 'WAITING',
        },
      });
    } else {
      // Otherwise use count-based selection
      if (typeof count !== 'number' || count < 1 || count > 1000) {
        return errors.badRequest('Count must be between 1 and 1000');
      }

      waitlistEntries = await prisma.waitlist.findMany({
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
    }

    if (waitlistEntries.length === 0) {
      return successResponse({
        invited: 0,
        message: 'No waitlist entries to invite',
      });
    }

    // Update status to INVITED and generate invitation codes
    const invitedAt = new Date();
    const codeExpiresAt = new Date();
    codeExpiresAt.setDate(codeExpiresAt.getDate() + 7); // 7 days expiry
    
    // Update each entry with invitation code
    for (const entry of waitlistEntries) {
      const invitationCode = generateInvitationCode();
      
      await prisma.waitlist.update({
        where: { id: entry.id },
        data: {
          status: 'INVITED',
          invitedAt,
          invitationCode,
          codeExpiresAt,
          maxUses: 1,
        } as any, // Using any for new fields
      });
      
      // Send invitation email with the code
      try {
        const appWithMaster = app as any; // Cast to access new fields
        const policy = app.policyJson as any;
        const invitationCredits = policy?.invitationCredits || app.initialCreditsPerDay || 3;
        
        await sendInvitationEmail(app, entry.email, {
          invitationCode,
          invitationLink: app.domain ? 
            `https://${app.domain}/invite/${invitationCode}` : 
            `https://your-app.com/invite/${invitationCode}`,
          masterCode: appWithMaster.masterReferralCode || '',
          credits: invitationCredits,
          expiresAt: codeExpiresAt,
          referralLink: app.domain ? 
            `https://${app.domain}/r/${invitationCode}` : 
            `https://your-app.com/r/${invitationCode}`,
        });
        
        console.log(`Invitation email sent to ${entry.email} with code ${invitationCode}`);
      } catch (emailError) {
        console.error(`Failed to send invitation email to ${entry.email}:`, emailError);
        // Continue with other invitations even if one fails
      }
    }

    // Log events for each invitation
    const eventLogs = waitlistEntries.map(entry => ({
      appId,
      event: 'waitlist.invited',
      entityType: 'waitlist',
      entityId: entry.id,
      metadata: {
        email: entry.email,
        position: entry.position,
        emailSent: true,
      },
    }));

    await prisma.eventLog.createMany({
      data: eventLogs,
    });

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
