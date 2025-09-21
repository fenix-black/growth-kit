import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email/send';
import { errors, successResponse } from '@/lib/utils/response';
import crypto from 'crypto';

// This cron job should be called daily at a scheduled time (e.g., 9 AM)
// Vercel Cron configuration: 0 9 * * * (daily at 9 AM UTC)

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (check for authorization header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return errors.unauthorized();
    }

    // Get current hour to match with app invitation times
    const currentHour = new Date().getUTCHours();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;

    // Find apps with auto-invite enabled that match current time
    const appsToProcess = await prisma.app.findMany({
      where: {
        isActive: true,
        autoInviteEnabled: true,
        inviteTime: currentTime,
        masterReferralCode: { not: null }, // Must have a master code configured
      },
    });

    const results = [];

    for (const app of appsToProcess) {
      try {
        // Get the next batch of waiting users for this app
        const waitingUsers = await prisma.waitlist.findMany({
          where: {
            appId: app.id,
            status: 'WAITING',
          },
          orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' },
          ],
          take: app.dailyInviteQuota,
        });

        let invitedCount = 0;
        const errors = [];

        for (const waitlistEntry of waitingUsers) {
          try {
            // Generate invitation link with master referral code
            const invitationLink = `${app.domain}/r/${app.masterReferralCode}`;
            
            // Send invitation email
            const emailResult = await sendInvitationEmail(
              app,
              waitlistEntry.email,
              {
                invitationLink,
                masterCode: app.masterReferralCode!,
                credits: app.masterReferralCredits,
                referralLink: invitationLink, // Same as invitation link for master codes
              }
            );

            if (emailResult.success) {
              // Update waitlist entry to invited
              await prisma.waitlist.update({
                where: { id: waitlistEntry.id },
                data: {
                  status: 'INVITED',
                  invitedAt: new Date(),
                  invitedVia: 'auto',
                  invitationEmail: waitlistEntry.email,
                },
              });

              // Log event
              await prisma.eventLog.create({
                data: {
                  appId: app.id,
                  event: 'waitlist.auto_invited',
                  entityType: 'waitlist',
                  entityId: waitlistEntry.id,
                  metadata: {
                    email: waitlistEntry.email,
                    position: waitlistEntry.position,
                    masterCode: app.masterReferralCode,
                  },
                },
              });

              invitedCount++;
            } else {
              errors.push({
                email: waitlistEntry.email,
                error: emailResult.error,
              });
            }
          } catch (error: any) {
            errors.push({
              email: waitlistEntry.email,
              error: error.message,
            });
          }
        }

        results.push({
          appId: app.id,
          appName: app.name,
          invitedCount,
          quota: app.dailyInviteQuota,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (error: any) {
        results.push({
          appId: app.id,
          appName: app.name,
          error: error.message,
        });
      }
    }

    // Return summary
    return successResponse({
      processed: appsToProcess.length,
      time: currentTime,
      results,
    });
  } catch (error: any) {
    console.error('Error in cron/invite-waitlist:', error);
    return errors.serverError(error.message);
  }
}

// Manual trigger for testing (protected by service key)
export async function POST(request: NextRequest) {
  try {
    // Verify service key
    const { verifyServiceKey } = await import('@/lib/security/auth');
    const isAuthorized = verifyServiceKey(request.headers);
    if (!isAuthorized) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const { appId, limit } = body;

    if (!appId) {
      return errors.badRequest('App ID is required');
    }

    // Get app configuration
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    if (!app.masterReferralCode) {
      return errors.badRequest('App does not have a master referral code configured');
    }

    // Get waiting users
    const waitingUsers = await prisma.waitlist.findMany({
      where: {
        appId: app.id,
        status: 'WAITING',
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
      take: limit || app.dailyInviteQuota,
    });

    const invitedUsers = [];
    const failedInvites = [];

    for (const waitlistEntry of waitingUsers) {
      try {
        // Generate invitation link
        const invitationLink = `${app.domain}/r/${app.masterReferralCode}`;
        
        // Send invitation email
        const emailResult = await sendInvitationEmail(
          app,
          waitlistEntry.email,
          {
            invitationLink,
            masterCode: app.masterReferralCode,
            credits: app.masterReferralCredits,
            referralLink: invitationLink,
          }
        );

        if (emailResult.success) {
          // Update waitlist entry
          await prisma.waitlist.update({
            where: { id: waitlistEntry.id },
            data: {
              status: 'INVITED',
              invitedAt: new Date(),
              invitedVia: 'manual',
              invitationEmail: waitlistEntry.email,
            },
          });

          // Log event
          await prisma.eventLog.create({
            data: {
              appId: app.id,
              event: 'waitlist.manual_invited',
              entityType: 'waitlist',
              entityId: waitlistEntry.id,
              metadata: {
                email: waitlistEntry.email,
                position: waitlistEntry.position,
                masterCode: app.masterReferralCode,
              },
            },
          });

          invitedUsers.push({
            email: waitlistEntry.email,
            position: waitlistEntry.position,
          });
        } else {
          failedInvites.push({
            email: waitlistEntry.email,
            error: emailResult.error,
          });
        }
      } catch (error: any) {
        failedInvites.push({
          email: waitlistEntry.email,
          error: error.message,
        });
      }
    }

    return successResponse({
      appId: app.id,
      appName: app.name,
      invited: invitedUsers,
      failed: failedInvites,
      summary: {
        total: waitingUsers.length,
        invited: invitedUsers.length,
        failed: failedInvites.length,
      },
    });
  } catch (error: any) {
    console.error('Error in manual invite-waitlist:', error);
    return errors.serverError(error.message);
  }
}
