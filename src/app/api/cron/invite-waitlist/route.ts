import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email/send';
import { errors, successResponse } from '@/lib/utils/response';
import { generateInvitationCode, calculateCodeExpiration } from '@/lib/utils/invitationCode';
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
    let totalInvited = 0;

    for (const app of appsToProcess) {
      const startTime = Date.now();
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
            // Generate unique invitation code for this user
            let invitationCode: string;
            let codeIsUnique = false;
            let attempts = 0;
            
            // Try to generate a unique code (handle rare collisions)
            while (!codeIsUnique && attempts < 5) {
              invitationCode = generateInvitationCode();
              const existingCode = await prisma.waitlist.findFirst({
                where: {
                  appId: app.id,
                  invitationCode: invitationCode,
                },
              });
              if (!existingCode) {
                codeIsUnique = true;
              }
              attempts++;
            }
            
            if (!codeIsUnique) {
              throw new Error('Failed to generate unique invitation code');
            }
            
            // Calculate expiration date (7 days from now)
            const codeExpiresAt = calculateCodeExpiration(7);
            
            // Generate invitation link with unique code
            const invitationLink = `${app.domain}/invite?code=${invitationCode!}`;
            
            // Send invitation email
            const emailResult = await sendInvitationEmail(
              app,
              waitlistEntry.email,
              {
                invitationLink,
                invitationCode: invitationCode!,
                masterCode: app.masterReferralCode!,
                credits: app.masterReferralCredits,
                referralLink: `${app.domain}/r/${app.masterReferralCode}`,
                expiresAt: codeExpiresAt,
              }
            );

            if (emailResult.success) {
              // Update waitlist entry to invited with invitation code
              await prisma.waitlist.update({
                where: { id: waitlistEntry.id },
                data: {
                  status: 'INVITED',
                  invitedAt: new Date(),
                  invitedVia: 'auto',
                  invitationEmail: waitlistEntry.email,
                  invitationCode: invitationCode!,
                  codeExpiresAt,
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
                    invitationCode: invitationCode!,
                    masterCode: app.masterReferralCode,
                    expiresAt: codeExpiresAt,
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

        const duration = Date.now() - startTime;
        totalInvited += invitedCount;
        
        // Log cron execution event
        await prisma.eventLog.create({
          data: {
            appId: app.id,
            event: 'cron.invite_waitlist',
            entityType: 'cron',
            metadata: {
              appName: app.name,
              invitedCount,
              totalProcessed: waitingUsers.length,
              errors: errors.length > 0 ? errors.map(e => e.error) : [],
              dailyQuota: app.dailyInviteQuota,
              duration,
              status: errors.length === 0 ? 'success' : invitedCount > 0 ? 'partial' : 'failed',
            },
          },
        });
        
        results.push({
          appId: app.id,
          appName: app.name,
          invitedCount,
          quota: app.dailyInviteQuota,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // Log failed cron execution
        await prisma.eventLog.create({
          data: {
            appId: app.id,
            event: 'cron.invite_waitlist',
            entityType: 'cron',
            metadata: {
              appName: app.name,
              invitedCount: 0,
              totalProcessed: 0,
              errors: [error.message],
              dailyQuota: app.dailyInviteQuota,
              duration,
              status: 'failed',
            },
          },
        });
        
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
      totalInvited,
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
        // Generate unique invitation code for this user
        let invitationCode: string;
        let codeIsUnique = false;
        let attempts = 0;
        
        // Try to generate a unique code (handle rare collisions)
        while (!codeIsUnique && attempts < 5) {
          invitationCode = generateInvitationCode();
          const existingCode = await prisma.waitlist.findFirst({
            where: {
              appId: app.id,
              invitationCode: invitationCode,
            },
          });
          if (!existingCode) {
            codeIsUnique = true;
          }
          attempts++;
        }
        
        if (!codeIsUnique) {
          throw new Error('Failed to generate unique invitation code');
        }
        
        // Calculate expiration date (7 days from now)
        const codeExpiresAt = calculateCodeExpiration(7);
        
        // Generate invitation link with unique code
        const invitationLink = `${app.domain}/invite?code=${invitationCode!}`;
        
        // Send invitation email
        const emailResult = await sendInvitationEmail(
          app,
          waitlistEntry.email,
          {
            invitationLink,
            invitationCode: invitationCode!,
            masterCode: app.masterReferralCode,
            credits: app.masterReferralCredits,
            referralLink: `${app.domain}/r/${app.masterReferralCode}`,
            expiresAt: codeExpiresAt,
          }
        );

        if (emailResult.success) {
          // Update waitlist entry with invitation code
          await prisma.waitlist.update({
            where: { id: waitlistEntry.id },
            data: {
              status: 'INVITED',
              invitedAt: new Date(),
              invitedVia: 'manual',
              invitationEmail: waitlistEntry.email,
              invitationCode: invitationCode!,
              codeExpiresAt,
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
                invitationCode: invitationCode!,
                masterCode: app.masterReferralCode,
                expiresAt: codeExpiresAt,
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
