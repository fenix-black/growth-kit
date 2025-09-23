import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateReferralCode, verifyClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';
import { isValidFingerprint } from '@/lib/utils/validation';
import { isInvitationCode, isCodeExpired } from '@/lib/utils/invitationCode';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    // Rate limiting by IP
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, rateLimits.api);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Get fingerprint and optional claim from request body
    const body = await request.json();
    const { fingerprint, claim } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return corsErrors.badRequest('Invalid or missing fingerprint', origin);
    }

    // Rate limiting by fingerprint
    const fingerprintRateLimit = await checkRateLimit(
      `${authContext.app.id}:${fingerprint}`,
      rateLimits.fingerprint
    );
    if (!fingerprintRateLimit.success) {
      return fingerprintRateLimit.response!;
    }

    // Upsert fingerprint record
    let fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: authContext.app.id,
          fingerprint,
        },
      },
      include: {
        credits: {
          orderBy: { createdAt: 'desc' },
        },
        usage: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create new fingerprint if doesn't exist
    if (!fingerprintRecord) {
      const referralCode = generateReferralCode();
      
      fingerprintRecord = await prisma.fingerprint.create({
        data: {
          appId: authContext.app.id,
          fingerprint,
          referralCode,
        },
        include: {
          credits: true,
          usage: true,
        },
      });

      // Log fingerprint creation event
      await prisma.eventLog.create({
        data: {
          appId: authContext.app.id,
          event: 'fingerprint.created',
          entityType: 'fingerprint',
          entityId: fingerprintRecord.id,
          metadata: { fingerprint },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent'),
        },
      });
    }

    // Process referral claim if present (works for both new and existing users)
    if (claim) {
      // First check if this is an invitation code (INV-XXXXXX format)
      if (isInvitationCode(claim)) {
        // Handle unique invitation code redemption
        const waitlistEntry = await prisma.waitlist.findFirst({
          where: {
            appId: authContext.app.id,
            invitationCode: claim,
          } as any, // Temporary cast until TypeScript picks up new schema
        });

        if (waitlistEntry && !isCodeExpired((waitlistEntry as any).codeExpiresAt)) {
          // Check if code hasn't been used or was used by the same fingerprint
          if (!(waitlistEntry as any).codeUsedAt || (waitlistEntry as any).fingerprintId === fingerprintRecord!.id) {
            // Only process if not already used by this fingerprint
            if (!(waitlistEntry as any).codeUsedAt) {
              // Redeem the invitation code
              await prisma.$transaction(async (tx) => {
                // Update waitlist entry
                await tx.waitlist.update({
                  where: { id: waitlistEntry.id },
                  data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                    fingerprintId: fingerprintRecord!.id,
                    codeUsedAt: new Date(),
                    useCount: { increment: 1 },
                  },
                });

                // Grant invitation credits
                const creditsToGrant = (authContext.app as any).masterReferralCredits || 10;
                await tx.credit.create({
                  data: {
                    fingerprintId: fingerprintRecord!.id,
                    amount: creditsToGrant,
                    reason: 'invitation',
                    metadata: {
                      invitationCode: claim,
                      waitlistId: waitlistEntry.id,
                    },
                  },
                });

                // Create or update lead with email
                await tx.lead.upsert({
                  where: {
                    appId_email: {
                      appId: authContext.app.id,
                      email: waitlistEntry.email,
                    },
                  },
                  update: {
                    fingerprintId: fingerprintRecord!.id,
                    emailVerified: true,
                  },
                  create: {
                    appId: authContext.app.id,
                    fingerprintId: fingerprintRecord!.id,
                    email: waitlistEntry.email,
                    emailVerified: true,
                  },
                });

                // Log event
                await tx.eventLog.create({
                  data: {
                    appId: authContext.app.id,
                    event: 'invitation.redeemed',
                    entityType: 'waitlist',
                    entityId: waitlistEntry.id,
                    metadata: {
                      invitationCode: claim,
                      fingerprintId: fingerprintRecord!.id,
                      email: waitlistEntry.email,
                    },
                    ipAddress: clientIp,
                    userAgent: request.headers.get('user-agent'),
                  },
                });
              });

              // Re-fetch fingerprint to include new credits
              fingerprintRecord = await prisma.fingerprint.findUnique({
                where: { id: fingerprintRecord.id },
                include: {
                  credits: true,
                  usage: true,
                },
              });
            }
          }
        }
      } else {
        // Process regular referral claim
        const claimPayload = verifyClaim(claim);
        
        if (claimPayload && claimPayload.referralCode) {
          // Check if this user has already claimed a referral
          const existingReferral = await prisma.referral.findFirst({
            where: {
              referredId: fingerprintRecord.id,
            },
          });

          // Only process if they haven't been referred before
          if (!existingReferral) {
            const app = authContext.app as any; // Temporary cast until migration is run
            // Check if this is a master referral code
            if (app.masterReferralCode === claimPayload.referralCode) {
            // This is a master referral - award master credits without a referrer
            await prisma.credit.create({
              data: {
                fingerprintId: fingerprintRecord.id,
                amount: app.masterReferralCredits || 10,
                reason: 'master_referral',
                metadata: { 
                  masterCode: claimPayload.referralCode,
                  type: 'invitation',
                },
              },
            });

            // If user has email, update their waitlist status to invited
            const lead = await prisma.lead.findFirst({
              where: {
                appId: authContext.app.id,
                fingerprintId: fingerprintRecord.id,
                emailVerified: true,
              },
            });

            if (lead) {
              await prisma.waitlist.upsert({
                where: {
                  appId_email: {
                    appId: authContext.app.id,
                    email: lead.email!,
                  },
                },
                create: {
                  appId: authContext.app.id,
                  email: lead.email!,
                  status: 'INVITED',
                  invitedAt: new Date(),
                  ...({ invitedVia: 'master_referral' } as any), // Temporary cast until migration is run
                } as any,
                update: {
                  status: 'INVITED',
                  invitedAt: new Date(),
                  ...({ invitedVia: 'master_referral' } as any), // Temporary cast until migration is run
                } as any,
              });
            }

            // Log event
            await prisma.eventLog.create({
              data: {
                appId: authContext.app.id,
                event: 'master_referral.claimed',
                entityType: 'fingerprint',
                entityId: fingerprintRecord.id,
                metadata: { 
                  masterCode: claimPayload.referralCode,
                  credits: app.masterReferralCredits,
                },
              },
            });

            // Re-fetch fingerprint to include new credits
            fingerprintRecord = await prisma.fingerprint.findUnique({
              where: { id: fingerprintRecord.id },
              include: {
                credits: true,
                usage: true,
              },
            });
          } else {
            // Regular referral - find the referrer by their referral code
            const referrerFingerprint = await prisma.fingerprint.findUnique({
              where: { 
                referralCode: claimPayload.referralCode 
              },
            });

            if (referrerFingerprint && referrerFingerprint.appId === authContext.app.id) {
              // Prevent self-referral
              if (referrerFingerprint.id !== fingerprintRecord.id) {
                const policy = authContext.app.policyJson as any;
                const referralCredits = policy?.referralCredits || 5;
                const referredCredits = policy?.referredCredits || 3;

                // Check daily referral cap for the referrer
                const today = new Date();
                today.setHours(0, 0, 0, 0);
              
                const todaysReferrals = await prisma.referral.count({
                  where: {
                    referrerId: referrerFingerprint.id,
                    claimedAt: { gte: today },
                  },
                });

                const dailyCap = policy?.dailyReferralCap || 10;
                
                if (todaysReferrals < dailyCap) {
                // Create referral record
                const referral = await prisma.referral.create({
                  data: {
                    appId: authContext.app.id,
                    referrerId: referrerFingerprint.id,
                    referredId: fingerprintRecord.id,
                    claimToken: claim,
                    claimExpiresAt: new Date(claimPayload.expiresAt),
                    claimedAt: new Date(),
                  },
                });

                // Award credits to the referred user
                await prisma.credit.create({
                  data: {
                    fingerprintId: fingerprintRecord!.id,
                    amount: referredCredits,
                    reason: 'referral',
                    metadata: { 
                      referrerId: referrerFingerprint.id,
                      referralCode: claimPayload.referralCode 
                    },
                  },
                });

                // Award credits to the referrer
                await prisma.credit.create({
                  data: {
                    fingerprintId: referrerFingerprint.id,
                    amount: referralCredits,
                    reason: 'referral',
                    metadata: { 
                      referredId: fingerprintRecord.id 
                    },
                  },
                });

                // Log referral event
                await prisma.eventLog.create({
                  data: {
                    appId: authContext.app.id,
                    event: 'referral.claimed',
                    entityType: 'referral',
                    entityId: referral.id,
                    metadata: { 
                      referrerId: referrerFingerprint.id,
                      referredId: fingerprintRecord.id,
                      referralCode: claimPayload.referralCode,
                    },
                    ipAddress: clientIp,
                    userAgent: request.headers.get('user-agent'),
                  },
                });

                // Re-fetch to include new credits
                fingerprintRecord = await prisma.fingerprint.findUnique({
                  where: { id: fingerprintRecord.id },
                  include: {
                    credits: true,
                    usage: true,
                  },
                });
                }
              }
            }
            }
          }
        }
      }
    }

    // Ensure fingerprintRecord is not null (it can't be at this point, but TypeScript needs help)
    if (!fingerprintRecord) {
      return errors.serverError('Failed to create or retrieve user');
    }

    // Process daily credit grants
    const app = authContext.app as any; // Using any until migration is run
    
    // Determine if user should receive credits
    let shouldGrantCredits = false;
    
    if (!app.waitlistEnabled) {
      // No waitlist - everyone gets credits
      shouldGrantCredits = true;
    } else if (app.waitlistEnabled) {
      // Check if user is invited or accepted
      const lead = await prisma.lead.findFirst({
        where: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord!.id,
        },
        select: { email: true },
      });
      
      if (lead) {
        const waitlistEntry = await prisma.waitlist.findUnique({
          where: {
            appId_email: {
              appId: authContext.app.id,
              email: lead.email!,
            },
          },
          select: { status: true },
        });
        
        // Grant credits if invited or accepted
        if (waitlistEntry && (waitlistEntry.status === 'INVITED' || waitlistEntry.status === 'ACCEPTED')) {
          shouldGrantCredits = true;
        }
      }
    }
    
    if (shouldGrantCredits) {
      const now = new Date();
      const lastGrant = fingerprintRecord.lastDailyGrant;
      const policy = authContext.app.policyJson as any;
      
      // Determine credits amount based on context
      let creditsToGrant = app.initialCreditsPerDay || 3;
      let creditReason = 'daily_grant';
      
      // For invited users, use invitation credits if available
      const appWithWaitlist = authContext.app as any;
      if (appWithWaitlist.waitlistEnabled) {
        // Get the lead to find the user's email
        const lead = await prisma.lead.findFirst({
          where: {
            appId: authContext.app.id,
            fingerprintId: fingerprintRecord.id,
          },
          select: { email: true },
        });
        
        if (lead) {
          const waitlistEntry = await prisma.waitlist.findUnique({
            where: {
              appId_email: {
                appId: authContext.app.id,
                email: lead.email!,
              },
            },
          });
          
          if (waitlistEntry && (waitlistEntry.status === 'INVITED' || waitlistEntry.status === 'ACCEPTED')) {
            // Check if they already got invitation credits
            const hasInvitationCredits = fingerprintRecord.credits.some(c => 
              c.reason === 'invitation_grant'
            );
            
            if (!hasInvitationCredits) {
              // First time accepting invitation - use invitation credits
              creditsToGrant = policy?.invitationCredits || app.initialCreditsPerDay || 3;
              creditReason = 'invitation_grant';
            }
          }
        }
      }
      
      // Check if this is first visit or a new day (for daily credits)
      const isFirstVisit = !lastGrant;
      const daysSinceGrant = lastGrant ? 
        Math.floor((now.getTime() - lastGrant.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      if (creditReason === 'invitation_grant' || isFirstVisit || daysSinceGrant >= 1) {
        // Grant credits
        await prisma.credit.create({
          data: {
            fingerprintId: fingerprintRecord.id,
            amount: creditsToGrant,
            reason: creditReason,
            metadata: { 
              grantDate: now.toISOString(),
              isFirstGrant: isFirstVisit,
              type: creditReason
            }
          }
        });
        
        // Update last grant timestamp and activity
        await prisma.fingerprint.update({
          where: { id: fingerprintRecord.id },
          data: { 
            lastDailyGrant: now,
            lastActiveAt: now 
          }
        });

        // Re-fetch fingerprint to include new credits
        fingerprintRecord = await prisma.fingerprint.findUnique({
          where: { id: fingerprintRecord.id },
          include: {
            credits: true,
            usage: true,
          },
        });
      } else {
        // Just update activity timestamp
        await prisma.fingerprint.update({
          where: { id: fingerprintRecord.id },
          data: { lastActiveAt: now }
        });
      }
    } else {
      // Update activity timestamp for users without credit grants
      await prisma.fingerprint.update({
        where: { id: fingerprintRecord.id },
        data: { lastActiveAt: new Date() }
      });
    }

    // Calculate total credits
    const totalCredits = fingerprintRecord?.credits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    ) || 0;

    // Count usage
    const usageCount = fingerprintRecord?.usage.length || 0;

    // Get policy from app configuration
    const policy = authContext.app.policyJson as any;

    // Check waitlist status if enabled for this app
    let waitlistData = null;
    const appWithWaitlist = authContext.app as any; // Temporary cast until migration is run
    if (appWithWaitlist.waitlistEnabled) {
      // Check if user has an email registered (verified or unverified)
      const lead = await prisma.lead.findFirst({
        where: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord!.id,
          // Remove emailVerified requirement to check waitlist status for all emails
        },
        select: {
          email: true,
          emailVerified: true,
        },
      });

      if (lead) {
        // Check waitlist status for this email
        const waitlistEntry = await prisma.waitlist.findUnique({
          where: {
            appId_email: {
              appId: authContext.app.id,
              email: lead.email!,
            },
          },
        });

        if (waitlistEntry) {
          waitlistData = {
            enabled: true,
            status: waitlistEntry.status.toLowerCase(), // 'waiting', 'invited', 'accepted'
            position: waitlistEntry.position,
            invitedAt: waitlistEntry.invitedAt?.toISOString() || null,
            acceptedAt: waitlistEntry.acceptedAt?.toISOString() || null,
            email: lead.email,
            emailVerified: lead.emailVerified,
            // App requires waitlist membership - SDK will handle access based on status
            requiresWaitlist: true,
          };
        } else {
          // No waitlist entry yet
          waitlistData = {
            enabled: true,
            status: 'none',
            position: null,
            requiresWaitlist: true,
            message: appWithWaitlist.waitlistMessage || 'Join our exclusive waitlist for early access',
          };
        }
      } else {
        // No email registered yet
        waitlistData = {
          enabled: true,
          status: 'none',
          position: null,
          requiresWaitlist: true,
          message: appWithWaitlist.waitlistMessage || 'Join our exclusive waitlist for early access',
        };
      }
    }

    // Build response
    const response = successResponse({
      fingerprint: fingerprintRecord!.fingerprint,
      referralCode: fingerprintRecord!.referralCode,
      credits: totalCredits,
      usage: usageCount,
      policy: policy || {
        referralCredits: 5,
        referredCredits: 3,
        nameClaimCredits: 2,
        emailClaimCredits: 2,
        emailVerifyCredits: 5,
        dailyReferralCap: 10,
        actions: {
          default: { creditsRequired: 1 }
        }
      },
      ...(waitlistData && { waitlist: waitlistData }),
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/me:', error);
    return errors.serverError();
  }
}
