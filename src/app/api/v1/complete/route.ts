import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { verifyClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';import { isValidFingerprint } from '@/lib/utils/validation';

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

    // Parse request body
    const body = await request.json();
    const { fingerprint, action = 'default', claim, usdValue, creditsRequired: clientCreditsRequired } = body;

    if (!fingerprint || !isValidFingerprint(fingerprint)) {
      return errors.badRequest('Invalid or missing fingerprint');
    }

    // Validate USD value if provided
    let validatedUsdValue: number | undefined;
    if (usdValue !== undefined && authContext.app.trackUsdValue) {
      const parsedValue = parseFloat(usdValue);
      if (isNaN(parsedValue) || parsedValue < 0) {
        return errors.badRequest('Invalid USD value: must be a positive number');
      }
      // Round to 2 decimal places
      validatedUsdValue = Math.round(parsedValue * 100) / 100;
      if (validatedUsdValue > 999999.99) {
        return errors.badRequest('USD value exceeds maximum allowed (999999.99)');
      }
    }

    // Get fingerprint record
    const fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: authContext.app.id,
          fingerprint,
        },
      },
      include: {
        credits: true,
        referredBy: true,
      },
    });

    if (!fingerprintRecord) {
      return errors.badRequest('Fingerprint not found. Call /v1/me first');
    }

    // Get policy
    const policy = authContext.app.policyJson as any;
    
    // Determine credits required
    let creditsRequired: number;
    let creditSource: 'policy' | 'client' | 'default';
    
    
    // Priority 1: Policy-defined action
    const actionConfig = policy?.actions?.[action];
    if (actionConfig) {
      creditsRequired = actionConfig.creditsRequired || 1;
      creditSource = 'policy';
    }
    // Priority 2: Client-specified (if allowed)
    // Default to true if allowCustomCredits is null/undefined (for backward compatibility)
    else if ((authContext.app.allowCustomCredits ?? true) && clientCreditsRequired !== undefined) {
      // Validate client credits
      const requestedCredits = parseInt(String(clientCreditsRequired));
      if (isNaN(requestedCredits) || requestedCredits < 1) {
        return errors.badRequest('Invalid creditsRequired: must be a positive integer');
      }
      // Apply maximum limit (default to 100 if not set)
      const maxCredits = authContext.app.maxCustomCredits ?? 100;
      creditsRequired = Math.min(requestedCredits, maxCredits);
      creditSource = 'client';
    }
    // Priority 3: Default fallback
    else {
      creditsRequired = policy?.actions?.default?.creditsRequired || 1;
      creditSource = 'default';
    }

    // Calculate current credits
    const totalCredits = fingerprintRecord.credits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    );

    // Process referral claim if provided and not already referred
    if (claim && !fingerprintRecord.referredBy) {
      const claimPayload = verifyClaim(claim);
      
      if (claimPayload && claimPayload.referralCode) {
        // Find the referrer by referral code
        const referrer = await prisma.fingerprint.findUnique({
          where: { referralCode: claimPayload.referralCode },
        });

        if (referrer && referrer.id !== fingerprintRecord.id) {
          // Check daily referral cap
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayReferrals = await prisma.referral.count({
            where: {
              referrerId: referrer.id,
              claimedAt: { gte: today },
            },
          });

          const dailyCap = policy?.dailyReferralCap || 10;
          
          if (todayReferrals < dailyCap) {
            // Create referral relationship
            const referral = await prisma.referral.create({
              data: {
                appId: authContext.app.id,
                referrerId: referrer.id,
                referredId: fingerprintRecord.id,
                claimToken: claim,
                claimedAt: new Date(),
              },
            });

            // Award credits to referrer
            await prisma.credit.create({
              data: {
                fingerprintId: referrer.id,
                amount: policy?.referralCredits || 5,
                reason: 'referral',
                metadata: { referredId: fingerprintRecord.id },
              },
            });

            // Award credits to referred user
            await prisma.credit.create({
              data: {
                fingerprintId: fingerprintRecord.id,
                amount: policy?.referredCredits || 3,
                reason: 'referral',
                metadata: { referrerId: referrer.id },
              },
            });

            // Log event
            await prisma.eventLog.create({
              data: {
                appId: authContext.app.id,
                event: 'referral.claimed',
                entityType: 'referral',
                entityId: referral.id,
                metadata: { referrerId: referrer.id, referredId: fingerprintRecord.id },
                ipAddress: clientIp,
                userAgent: request.headers.get('user-agent'),
              },
            });
          }
        }
      }
    }

    // Record usage with optional USD value
    const usage = await prisma.usage.create({
      data: {
        fingerprintId: fingerprintRecord.id,
        action,
        usdValue: validatedUsdValue,
        metadata: { timestamp: new Date() },
      },
    });

    // Check if user has sufficient credits
    if (creditsRequired > 0 && totalCredits < creditsRequired) {
      // Insufficient credits - return error
      return withCorsHeaders(
        errors.badRequest(`Insufficient credits. Required: ${creditsRequired}, Available: ${totalCredits}`),
        origin,
        authContext.app.corsOrigins
      );
    }

    // Consume credits if required
    let creditsConsumed = false;
    let newCreditsBalance = totalCredits;

    if (creditsRequired > 0) {
      // Consume credits
      await prisma.credit.create({
        data: {
          fingerprintId: fingerprintRecord.id,
          amount: -creditsRequired,
          reason: 'consumed',
          metadata: { action, usageId: usage.id },
        },
      });
      
      creditsConsumed = true;
      newCreditsBalance = totalCredits - creditsRequired;
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: authContext.app.id,
        event: 'action.completed',
        entityType: 'usage',
        entityId: usage.id,
        metadata: { 
          action, 
          creditsConsumed,
          creditsRequired,
          hadSufficientCredits: totalCredits >= creditsRequired,
          usdValue: validatedUsdValue,
          creditSource,
          isCustomCredits: creditSource === 'client'
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });


    // Build response
    const response = successResponse({
      success: true,
      creditsConsumed,
      creditsRemaining: Math.max(0, newCreditsBalance),
      creditsRequired,
      hadSufficientCredits: totalCredits >= creditsRequired,
      // Temporary debug info
      _debug: {
        creditSource,
        clientCreditsRequested: clientCreditsRequired,
        allowCustomCredits: authContext.app.allowCustomCredits,
        maxCustomCredits: authContext.app.maxCustomCredits,
        actionInPolicy: !!policy?.actions?.[action]
      }
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      authContext.app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /v1/complete:', error);
    return errors.serverError();
  }
}
