import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { generateInvitationCode } from '@/lib/utils/invitationCode';
import { sendInvitationEmail } from '@/lib/email/send';

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
    
    // Get app details for email sending
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });
    
    if (!app) {
      return errors.notFound();
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

    // Send invitation email
    try {
      const appWithMaster = app as any; // Cast to access new fields
      const policy = app.policyJson as any;
      const invitationCredits = policy?.invitationCredits || app.initialCreditsPerDay || 3;
      
      await sendInvitationEmail(app, email, {
        invitationCode: code,
        invitationLink: app.domain ? 
          `https://${app.domain}/invite/${code}` : 
          `https://your-app.com/invite/${code}`,
        masterCode: appWithMaster.masterReferralCode || '',
        credits: invitationCredits,
        expiresAt: expiresAt,
        referralLink: app.domain ? 
          `https://${app.domain}/r/${code}` : 
          `https://your-app.com/r/${code}`,
      });
      
      console.log(`Invitation email sent to ${email} with code ${code}`);
    } catch (emailError) {
      console.error(`Failed to send invitation email to ${email}:`, emailError);
      // Continue even if email fails - the invitation is still valid
    }

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
          emailSent: true,
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
