import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { verifyClaim } from '@/lib/security/hmac';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimitSafe';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { successResponse, errors } from '@/lib/utils/response';
import { corsErrors } from '@/lib/utils/corsResponse';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    const { app, fingerprint: fingerprintRecord } = authContext;

    // Verify origin is allowed for this app (includes default origins)
    if (origin && !isOriginAllowed(origin, app.corsOrigins)) {
      return corsErrors.forbidden(origin);
    }

    // Rate limiting by IP
    const clientIp = getClientIp(request.headers);
    const rateLimitCheck = await checkRateLimit(clientIp, 'api');
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    // Parse request body
    const body = await request.json();
    const { action = 'default', claim, usdValue, creditsRequired: clientCreditsRequired, metadata } = body;

    // Validate USD value if provided
    let validatedUsdValue: number | undefined;
    if (usdValue !== undefined && app.trackUsdValue) {
      const parsedValue = parseFloat(usdValue);
      if (isNaN(parsedValue) || parsedValue < 0) {
        return corsErrors.badRequest('Invalid USD value: must be a positive number', origin);
      }
      // Round to 2 decimal places
      validatedUsdValue = Math.round(parsedValue * 100) / 100;
      if (validatedUsdValue > 999999.99) {
        return corsErrors.badRequest('USD value exceeds maximum allowed (999999.99)', origin);
      }
    }

    // Get fingerprint record with credits and referral info
    const fingerprintWithDetails = await prisma.fingerprint.findUnique({
      where: { id: fingerprintRecord.id },
      include: {
        credits: true,
        referredBy: true,
      },
    });

    if (!fingerprintWithDetails) {
      return corsErrors.badRequest('Fingerprint not found', origin);
    }

    // Get policy
    const policy = app.policyJson as any;
    
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
    else if ((app.allowCustomCredits ?? true) && clientCreditsRequired !== undefined) {
      // Validate client credits
      const requestedCredits = parseInt(String(clientCreditsRequired));
      if (isNaN(requestedCredits) || requestedCredits < 1) {
        return corsErrors.badRequest('Invalid creditsRequired: must be a positive integer', origin);
      }
      // Apply maximum limit (default to 100 if not set)
      const maxCredits = app.maxCustomCredits ?? 100;
      creditsRequired = Math.min(requestedCredits, maxCredits);
      creditSource = 'client';
    }
    // Priority 3: Default fallback
    else {
      creditsRequired = policy?.actions?.default?.creditsRequired || 1;
      creditSource = 'default';
    }

    // Calculate current credits - handle shared accounts
    let totalCredits = 0;
    
    if (!(app as any).isolatedAccounts && (app as any).organizationId) {
      // Shared accounts enabled - calculate credits across all shared apps
      const sharedApps = await prisma.app.findMany({
        where: {
          organizationId: (app as any).organizationId,
          isolatedAccounts: false,
        } as any,
        select: { id: true },
      });
      
      const sharedAppIds = sharedApps.map(a => a.id);
      
      // Get all fingerprints across shared apps with the same fingerprint value
      const sharedFingerprints = await prisma.fingerprint.findMany({
        where: {
          fingerprint: fingerprintWithDetails.fingerprint,
          appId: { in: sharedAppIds },
        },
        select: {
          credits: {
            select: { amount: true },
          },
        },
      });
      
      // Sum credits from all shared fingerprints
      totalCredits = sharedFingerprints.reduce(
        (sum, fp) => sum + fp.credits.reduce((creditSum, credit) => creditSum + credit.amount, 0),
        0
      );
    } else {
      // Isolated accounts - use only current app's credits
      totalCredits = fingerprintWithDetails.credits.reduce(
        (sum, credit) => sum + credit.amount,
        0
      );
    }

    // Process referral claim if provided and not already referred
    if (claim && !fingerprintWithDetails.referredBy) {
      const claimPayload = verifyClaim(claim);
      
      if (claimPayload && claimPayload.referralCode) {
        // Find the referrer by referral code
        const referrer = await prisma.fingerprint.findUnique({
          where: { referralCode: claimPayload.referralCode },
        });

        if (referrer && referrer.id !== fingerprintWithDetails.id) {
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
                appId: app.id,
                referrerId: referrer.id,
                referredId: fingerprintWithDetails.id,
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
                metadata: { referredId: fingerprintWithDetails.id },
              },
            });

            // Award credits to referred user
            await prisma.credit.create({
              data: {
                fingerprintId: fingerprintWithDetails.id,
                amount: policy?.referredCredits || 3,
                reason: 'referral',
                metadata: { referrerId: referrer.id },
              },
            });

            // Log event
            await prisma.eventLog.create({
              data: {
                appId: app.id,
                event: 'referral.claimed',
                entityType: 'referral',
                entityId: referral.id,
                metadata: { referrerId: referrer.id, referredId: fingerprintWithDetails.id },
                ipAddress: clientIp,
                userAgent: request.headers.get('user-agent'),
              },
            });
          }
        }
      }
    }

    // Record usage with optional USD value and metadata
    const usage = await prisma.usage.create({
      data: {
        fingerprintId: fingerprintWithDetails.id,
        action,
        usdValue: validatedUsdValue,
        metadata: metadata || { timestamp: new Date() },
      },
    });

    // Check if user has sufficient credits
    if (creditsRequired > 0 && totalCredits < creditsRequired) {
      // Insufficient credits - return error
      return withCorsHeaders(
        corsErrors.badRequest(`Insufficient credits. Required: ${creditsRequired}, Available: ${totalCredits}`, origin),
        origin,
        app.corsOrigins
      );
    }

    // Consume credits if required
    let creditsConsumed = false;
    let newCreditsBalance = totalCredits;

    if (creditsRequired > 0) {
      // Consume credits
      await prisma.credit.create({
        data: {
          fingerprintId: fingerprintWithDetails.id,
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
        appId: app.id,
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
    });

    // Apply CORS headers
    return withCorsHeaders(
      response,
      origin,
      app.corsOrigins
    );
  } catch (error) {
    console.error('Error in /public/complete:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
