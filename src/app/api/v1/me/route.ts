import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { generateReferralCode, verifyClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp, rateLimits } from '@/lib/middleware/rateLimit';
import { withCorsHeaders, handleCorsPreflightResponse } from '@/lib/middleware/cors';
import { successResponse, errors } from '@/lib/utils/response';
import { isValidFingerprint } from '@/lib/utils/validation';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsOrigins = process.env.CORS_ALLOWLIST?.split(',') || [];
  return handleCorsPreflightResponse(origin, corsOrigins);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return errors.unauthorized();
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
      return errors.badRequest('Invalid or missing fingerprint');
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
                    fingerprintId: fingerprintRecord.id,
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

    // Ensure fingerprintRecord is not null (it can't be at this point, but TypeScript needs help)
    if (!fingerprintRecord) {
      return errors.serverError('Failed to create or retrieve user');
    }

    // Calculate total credits
    const totalCredits = fingerprintRecord.credits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    );

    // Count usage
    const usageCount = fingerprintRecord.usage.length;

    // Get policy from app configuration
    const policy = authContext.app.policyJson as any;

    // Check waitlist status if enabled for this app
    let waitlistData = null;
    const appWithWaitlist = authContext.app as any; // Temporary cast until migration is run
    if (appWithWaitlist.waitlistEnabled) {
      // Check if user has an email registered
      const lead = await prisma.lead.findFirst({
        where: {
          appId: authContext.app.id,
          fingerprintId: fingerprintRecord.id,
          emailVerified: true,
        },
        select: {
          email: true,
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
      fingerprint: fingerprintRecord.fingerprint,
      referralCode: fingerprintRecord.referralCode,
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
