import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { verifyClaim } from '@/lib/security/hmac';
import { getClientIp } from '@/lib/middleware/rateLimitSafe';
import { isInvitationCode, isCodeExpired } from '@/lib/utils/invitationCode';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const clientIp = getClientIp(request.headers);
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app, fingerprint } = authContext;

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    // Parse request body (for compatibility with original /v1/me endpoint)
    const body = await request.json();
    const { claim, context } = body; // Optional claim parameter and browser context

    // Get user data for this fingerprint - match original /v1/me format exactly
    let [fingerprintRecord, lead, usage] = await Promise.all([
      // Get fingerprint with credits and usage (matches original)
      prisma.fingerprint.findUnique({
        where: { id: fingerprint.id },
        include: {
          credits: {
            orderBy: { createdAt: 'desc' },
          },
          usage: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      
      // Get lead information if exists
      prisma.lead.findFirst({
        where: { fingerprintId: fingerprint.id },
        select: {
          name: true,
          email: true,
          emailVerified: true,
        },
      }),
      
      // Get usage count
      prisma.usage.count({
        where: { fingerprintId: fingerprint.id },
      }),
    ]);

    if (!fingerprintRecord) {
      return corsErrors.notFound(origin);
    }
    
    // For existing fingerprints, backfill location if missing
    if (!fingerprintRecord.location) {
      const clientIp = getClientIp(request.headers);
      const userAgent = request.headers.get('user-agent') || '';
      const { getGeolocation, detectBrowser, detectDevice } = await import('@/lib/utils/geolocation');
      const location = getGeolocation(clientIp, request.headers);
      const browser = context?.browser || detectBrowser(userAgent);
      const device = context?.device || detectDevice(userAgent);
      
      if (location.city || location.country) {
        await prisma.fingerprint.update({
          where: { id: fingerprintRecord.id },
          data: {
            browser,
            device,
            location,
          },
        });
      }
    }

    // Get app settings (need to refetch to get all fields)
    const appWithWaitlist = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        name: true,
        description: true,
        logoUrl: true,
        primaryColor: true,
        waitlistLayout: true,
        hideGrowthKitBranding: true,
        creditsPaused: true,
        policyJson: true,
        waitlistEnabled: true,
        waitlistEnabledAt: true,
        waitlistMessages: true,
        masterReferralCode: true,
        masterReferralCredits: true,
        initialCreditsPerDay: true,
      },
    });

    // Check if user should be grandfathered BEFORE processing any claims
    let isGrandfathered = false;
    if (appWithWaitlist?.waitlistEnabled && appWithWaitlist.waitlistEnabledAt) {
      isGrandfathered = fingerprintRecord.createdAt < appWithWaitlist.waitlistEnabledAt;
    }

    // Process referral claim if present (works for both new and existing users)
    // Skip invitation code processing for grandfathered users
    if (claim && !isGrandfathered) {
      // First check if this is an invitation code (INV-XXXXXX format)
      if (isInvitationCode(claim)) {
        // Handle unique invitation code redemption
        const waitlistEntry = await prisma.waitlist.findFirst({
          where: {
            appId: app.id,
            invitationCode: claim,
          } as any,
        });

        if (waitlistEntry && !isCodeExpired((waitlistEntry as any).codeExpiresAt)) {
          // Check if code hasn't been used or was used by the same fingerprint
          if (!(waitlistEntry as any).codeUsedAt || (waitlistEntry as any).fingerprintId === fingerprint.id) {
            // Only process if not already used by this fingerprint
            if (!(waitlistEntry as any).codeUsedAt) {
              // Accept the invitation
              await prisma.$transaction(async (tx) => {
                // Update waitlist entry to ACCEPTED
                await tx.waitlist.update({
                  where: { id: waitlistEntry.id },
                  data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                    fingerprintId: fingerprint.id,
                    codeUsedAt: new Date(),
                    useCount: { increment: 1 },
                  },
                });

                // Update existing lead with email
                const existingLead = await tx.lead.findFirst({
                  where: {
                    appId: app.id,
                    fingerprintId: fingerprint.id,
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
                    appId: app.id,
                    event: 'invitation.redeemed',
                    entityType: 'waitlist',
                    entityId: waitlistEntry.id,
                    metadata: {
                      invitationCode: claim,
                      fingerprintId: fingerprint.id,
                      email: waitlistEntry.email,
                    },
                    ipAddress: clientIp,
                    userAgent: request.headers.get('user-agent'),
                  },
                });
              });

              // Re-fetch fingerprint to include new credits
              fingerprintRecord = await prisma.fingerprint.findUnique({
                where: { id: fingerprint.id },
                include: {
                  credits: { orderBy: { createdAt: 'desc' } },
                  usage: { orderBy: { createdAt: 'desc' } },
                },
              });

              // Refetch lead
              lead = await prisma.lead.findFirst({
                where: { fingerprintId: fingerprint.id },
                select: { name: true, email: true, emailVerified: true },
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
            where: { referredId: fingerprint.id },
          });

          // Only process if they haven't been referred before
          if (!existingReferral) {
            // Check if this is a master referral code
            if (appWithWaitlist?.masterReferralCode === claimPayload.referralCode) {
              // This is a master referral - award master credits
              await prisma.credit.create({
                data: {
                  fingerprintId: fingerprint.id,
                  amount: appWithWaitlist.masterReferralCredits || 10,
                  reason: 'master_referral',
                  metadata: { 
                    masterCode: claimPayload.referralCode,
                    type: 'invitation',
                  },
                },
              });

              // If user has email, update their waitlist status
              if (lead && lead.email && lead.emailVerified) {
                await prisma.waitlist.upsert({
                  where: {
                    appId_email: { appId: app.id, email: lead.email },
                  },
                  create: {
                    appId: app.id,
                    email: lead.email,
                    status: 'INVITED',
                    invitedAt: new Date(),
                    ...({ invitedVia: 'master_referral' } as any),
                  } as any,
                  update: {
                    status: 'INVITED',
                    invitedAt: new Date(),
                    ...({ invitedVia: 'master_referral' } as any),
                  } as any,
                });
              }

              // Log event
              await prisma.eventLog.create({
                data: {
                  appId: app.id,
                  event: 'master_referral.claimed',
                  entityType: 'fingerprint',
                  entityId: fingerprint.id,
                  metadata: { 
                    masterCode: claimPayload.referralCode,
                    credits: appWithWaitlist.masterReferralCredits,
                  },
                },
              });

              // Re-fetch fingerprint
              fingerprintRecord = await prisma.fingerprint.findUnique({
                where: { id: fingerprint.id },
                include: {
                  credits: { orderBy: { createdAt: 'desc' } },
                  usage: { orderBy: { createdAt: 'desc' } },
                },
              });
            } else {
              // Regular referral - find the referrer by their referral code
              const referrerFingerprint = await prisma.fingerprint.findUnique({
                where: { referralCode: claimPayload.referralCode },
              });

              if (referrerFingerprint && referrerFingerprint.appId === app.id) {
                // Prevent self-referral
                if (referrerFingerprint.id !== fingerprint.id) {
                  const policy = appWithWaitlist?.policyJson as any;
                  const referralCredits = policy?.referralCredits || 5;
                  const referredCredits = policy?.referredCredits || 3;

                  // Check daily referral cap
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
                        appId: app.id,
                        referrerId: referrerFingerprint.id,
                        referredId: fingerprint.id,
                        claimToken: claim,
                        claimExpiresAt: new Date(claimPayload.expiresAt),
                        claimedAt: new Date(),
                      },
                    });

                    // Award credits to the referred user
                    await prisma.credit.create({
                      data: {
                        fingerprintId: fingerprint.id,
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
                        metadata: { referredId: fingerprint.id },
                      },
                    });

                    // Log referral event
                    await prisma.eventLog.create({
                      data: {
                        appId: app.id,
                        event: 'referral.claimed',
                        entityType: 'referral',
                        entityId: referral.id,
                        metadata: { 
                          referrerId: referrerFingerprint.id,
                          referredId: fingerprint.id,
                          referralCode: claimPayload.referralCode,
                        },
                        ipAddress: clientIp,
                        userAgent: request.headers.get('user-agent'),
                      },
                    });

                    // Re-fetch to include new credits
                    fingerprintRecord = await prisma.fingerprint.findUnique({
                      where: { id: fingerprint.id },
                      include: {
                        credits: { orderBy: { createdAt: 'desc' } },
                        usage: { orderBy: { createdAt: 'desc' } },
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

    // Ensure fingerprintRecord is not null
    if (!fingerprintRecord) {
      return corsErrors.serverError('Failed to retrieve user data', origin);
    }

    // Process daily credit grants
    let shouldGrantCredits = false;
    
    // Check if user was just referred
    const wasJustReferred = fingerprintRecord.credits.some(c => 
      c.reason === 'referral' && 
      new Date().getTime() - new Date(c.createdAt).getTime() < 60000
    );
    
    if (!appWithWaitlist?.waitlistEnabled) {
      // No waitlist - everyone gets credits
      shouldGrantCredits = true;
    } else if (appWithWaitlist.waitlistEnabled) {
      if (isGrandfathered) {
        shouldGrantCredits = true;
      } else {
        // Check if user is invited or accepted
        if (lead && lead.email) {
          const waitlistEntry = await prisma.waitlist.findUnique({
            where: {
              appId_email: { appId: app.id, email: lead.email },
            },
            select: { status: true },
          });
          
          if (waitlistEntry && (waitlistEntry.status === 'INVITED' || waitlistEntry.status === 'ACCEPTED')) {
            shouldGrantCredits = true;
          }
        }
        
        // Referred users should always get initial credits
        if (wasJustReferred) {
          shouldGrantCredits = true;
        }
      }
    }
    
    if (shouldGrantCredits && !appWithWaitlist?.creditsPaused) {
      const now = new Date();
      const lastGrant = fingerprintRecord.lastDailyGrant;
      const policy = appWithWaitlist?.policyJson as any;
      
      const isFirstVisit = !lastGrant;
      const daysSinceGrant = lastGrant ? 
        Math.floor((now.getTime() - lastGrant.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      let creditsToGrant = 0;
      let creditReason = '';
      
      if (isFirstVisit) {
        creditsToGrant = policy?.invitationCredits || appWithWaitlist?.initialCreditsPerDay || 5;
        creditReason = 'invitation_grant';
      } else if (daysSinceGrant >= 1) {
        creditsToGrant = appWithWaitlist?.initialCreditsPerDay || 3;
        creditReason = 'daily_grant';
      }
      
      if (creditsToGrant > 0) {
        await prisma.credit.create({
          data: {
            fingerprintId: fingerprint.id,
            amount: creditsToGrant,
            reason: creditReason,
            metadata: { 
              grantDate: now.toISOString(),
              isFirstGrant: isFirstVisit,
              type: creditReason
            }
          }
        });
        
        await prisma.fingerprint.update({
          where: { id: fingerprint.id },
          data: { 
            lastDailyGrant: now,
            lastActiveAt: now 
          }
        });

        // Re-fetch fingerprint to include new credits
        fingerprintRecord = await prisma.fingerprint.findUnique({
          where: { id: fingerprint.id },
          include: {
            credits: { orderBy: { createdAt: 'desc' } },
            usage: { orderBy: { createdAt: 'desc' } },
          },
        });
      } else {
        // Just update activity timestamp
        await prisma.fingerprint.update({
          where: { id: fingerprint.id },
          data: { lastActiveAt: now }
        });
      }
    } else {
      // Update activity timestamp
      await prisma.fingerprint.update({
        where: { id: fingerprint.id },
        data: { lastActiveAt: new Date() }
      });
    }

    // Create lead if it doesn't exist
    if (!lead) {
      await prisma.lead.create({
        data: {
          appId: app.id,
          fingerprintId: fingerprint.id,
        },
      });
      lead = {
        name: null,
        email: null,
        emailVerified: false,
      };
    }

    // Ensure fingerprintRecord is not null
    if (!fingerprintRecord) {
      return corsErrors.serverError('Failed to retrieve user data after processing', origin);
    }

    // Calculate total credits
    const totalCredits = fingerprintRecord.credits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    );

    // Check waitlist status
    let waitlistData = null;
    if (appWithWaitlist?.waitlistEnabled) {
      if (isGrandfathered) {
        // User existed before waitlist - grant access
        waitlistData = {
          enabled: true,
          status: 'accepted',
          position: null,
          requiresWaitlist: false,
          grandfathered: true,
        };
      } else {
        // Check if user has email and waitlist entry
        if (lead && lead.email) {
          const waitlistEntry = await prisma.waitlist.findUnique({
            where: {
              appId_email: {
                appId: app.id,
                email: lead.email,
              },
            },
          });

          if (waitlistEntry) {
            waitlistData = {
              enabled: true,
              status: waitlistEntry.status.toLowerCase(),
              position: waitlistEntry.position,
              invitedAt: waitlistEntry.invitedAt?.toISOString() || null,
              acceptedAt: waitlistEntry.acceptedAt?.toISOString() || null,
              email: lead.email,
              emailVerified: lead.emailVerified,
              messages: appWithWaitlist?.waitlistMessages || [],
              requiresWaitlist: waitlistEntry.status !== 'ACCEPTED',
            };
          } else {
            // No waitlist entry yet
            waitlistData = {
              enabled: true,
              status: 'none',
              position: null,
              requiresWaitlist: true,
              messages: appWithWaitlist?.waitlistMessages || [],
            };
          }
        } else {
          // No email registered yet
          waitlistData = {
            enabled: true,
            status: 'none',
            position: null,
            requiresWaitlist: true,
            messages: appWithWaitlist?.waitlistMessages || [],
          };
        }
      }
    }

    // Build response to match original /v1/me format exactly
    const userData = {
      fingerprint: fingerprintRecord.fingerprint,
      referralCode: fingerprintRecord.referralCode,
      credits: totalCredits,
      usage: usage,
      creditsPaused: appWithWaitlist?.creditsPaused || false,
      // User profile data (flat structure to match original)
      name: lead?.name || null,
      email: lead?.email || null,
      hasClaimedName: !!lead?.name,
      hasClaimedEmail: !!lead?.email,
      hasVerifiedEmail: lead?.emailVerified || false,
      // Use actual policy from app
      policy: appWithWaitlist?.policyJson || {
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
      // App branding for SDK widget
      app: {
        name: appWithWaitlist?.name || app.name,
        description: appWithWaitlist?.description,
        logoUrl: appWithWaitlist?.logoUrl,
        primaryColor: appWithWaitlist?.primaryColor,
        waitlistLayout: appWithWaitlist?.waitlistLayout,
        hideGrowthKitBranding: appWithWaitlist?.hideGrowthKitBranding || false,
      },
      // Include waitlist data if applicable
      ...(waitlistData && { waitlist: waitlistData }),
    };

    return withCorsHeaders(
      successResponse(userData),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public user error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
