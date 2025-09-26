import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateReferralCode, verifyClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
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
    const rateLimitCheck = await checkRateLimit(clientIp, 'api');
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
      'fingerprint'
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

    // Check if user should be grandfathered BEFORE processing any claims
    const appWithWaitlist = authContext.app as any;
    let isGrandfathered = false;
    if (appWithWaitlist.waitlistEnabled && appWithWaitlist.waitlistEnabledAt) {
      isGrandfathered = fingerprintRecord!.createdAt < appWithWaitlist.waitlistEnabledAt;
    }

    // Process referral claim if present (works for both new and existing users)
    // Skip invitation code processing for grandfathered users
    if (claim && !isGrandfathered) {
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
              // Accept the invitation (but don't grant credits here - will be done later)
              await prisma.$transaction(async (tx) => {
                // Update waitlist entry to ACCEPTED
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

                // Update existing lead with email (don't create new one)
                const existingLead = await tx.lead.findFirst({
                  where: {
                    appId: authContext.app.id,
                    fingerprintId: fingerprintRecord!.id,
                  },
                });

                if (existingLead) {
                  await tx.lead.update({
                    where: { id: existingLead.id },
                    data: {
                      email: waitlistEntry.email,
                      emailVerified: true,
                    },
                  });
                }

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
                  credits: {
                    orderBy: { createdAt: 'desc' },
                  },
                  usage: {
                    orderBy: { createdAt: 'desc' },
                  },
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

            if (lead && lead.email) {
              await prisma.waitlist.upsert({
                where: {
                  appId_email: {
                    appId: authContext.app.id,
                    email: lead.email,
                  },
                },
                create: {
                  appId: authContext.app.id,
                  email: lead.email,
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
                credits: {
                  orderBy: { createdAt: 'desc' },
                },
                usage: {
                  orderBy: { createdAt: 'desc' },
                },
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
                    credits: {
                      orderBy: { createdAt: 'desc' },
                    },
                    usage: {
                      orderBy: { createdAt: 'desc' },
                    },
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
    
    // Check if user was just referred - they should always get initial credits
    const wasJustReferred = fingerprintRecord!.credits.some(c => 
      c.reason === 'referral' && 
      new Date().getTime() - new Date(c.createdAt).getTime() < 60000 // Within last minute
    );
    
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
        select: { 
          name: true,
          email: true,
          emailVerified: true,
        },
      });
      
      if (lead && lead.email) {
        const waitlistEntry = await prisma.waitlist.findUnique({
          where: {
            appId_email: {
              appId: authContext.app.id,
              email: lead.email,
            },
          },
          select: { status: true },
        });
        
        // Grant credits if invited or accepted
        if (waitlistEntry && (waitlistEntry.status === 'INVITED' || waitlistEntry.status === 'ACCEPTED')) {
          shouldGrantCredits = true;
        }
      }
      
      // IMPORTANT: Referred users should always get initial credits as an incentive
      if (wasJustReferred) {
        shouldGrantCredits = true;
      }
    }
    
    if (shouldGrantCredits) {
      const now = new Date();
      const lastGrant = fingerprintRecord.lastDailyGrant;
      const policy = authContext.app.policyJson as any;
      
      // Check if this is the user's first visit ever
      const isFirstVisit = !lastGrant;
      const daysSinceGrant = lastGrant ? 
        Math.floor((now.getTime() - lastGrant.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      // Determine what kind of credits to grant
      let creditsToGrant = 0;
      let creditReason = '';
      
      if (isFirstVisit) {
        // First-time visit - grant invitation/initial credits
        // All new users get invitation_grant on their first visit
        creditsToGrant = policy?.invitationCredits || app.initialCreditsPerDay || 5;
        creditReason = 'invitation_grant';
      } else if (daysSinceGrant >= 1) {
        // Returning user on a new day - grant daily credits
        creditsToGrant = app.initialCreditsPerDay || 3;
        creditReason = 'daily_grant';
      }
      
      if (creditsToGrant > 0) {
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
            credits: {
              orderBy: { createdAt: 'desc' },
            },
            usage: {
              orderBy: { createdAt: 'desc' },
            },
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
    if (appWithWaitlist.waitlistEnabled) {
      // Use the isGrandfathered check we already did above
      if (isGrandfathered) {
        // User existed before waitlist was enabled, grant access
        waitlistData = {
          enabled: true,
          status: 'accepted',
          position: null,
          requiresWaitlist: false, // Important: don't require waitlist for grandfathered users
          grandfathered: true,
        };
      } else {
        // Not grandfathered - check waitlist status
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

        if (lead && lead.email) {
          // Check waitlist status for this email
          const waitlistEntry = await prisma.waitlist.findUnique({
          where: {
            appId_email: {
              appId: authContext.app.id,
              email: lead.email,
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
      } // Close the else block for non-grandfathered users
    }

    // Get or create user lead record
    let userLead = await prisma.lead.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprintId: fingerprintRecord!.id,
      },
      select: {
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    // Create lead if it doesn't exist
    if (!userLead) {
      const newLead = await prisma.lead.create({
        data: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord!.id,
        },
      });
      userLead = {
        name: null,
        email: null,
        emailVerified: false,
      };
    }

    // Build response
    const response = successResponse({
      fingerprint: fingerprintRecord!.fingerprint,
      referralCode: fingerprintRecord!.referralCode,
      credits: totalCredits,
      usage: usageCount,
      // User profile data
      name: userLead?.name || null,
      email: userLead?.email || null,
      hasClaimedName: !!userLead?.name,
      hasClaimedEmail: !!userLead?.email,
      hasVerifiedEmail: userLead?.emailVerified || false,
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
    
    // Handle Prisma connection pool timeouts specifically
    if (error instanceof Error && error.message.includes('connection pool')) {
      console.error('Connection pool timeout detected:', error.message);
      return corsErrors.serverError(
        'Service temporarily unavailable. Please try again in a moment.',
        origin
      );
    }
    
    // Handle other Prisma errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      console.error('Database error:', error.message);
      return corsErrors.serverError(
        'Database service temporarily unavailable',
        origin
      );
    }
    
    return corsErrors.serverError('Internal server error', origin);
  }
}
