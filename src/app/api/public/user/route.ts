import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';

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
    
    const { app, fingerprint } = authContext;

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    // Parse request body (for compatibility with original /v1/me endpoint)
    const body = await request.json();
    const { claim } = body; // Optional claim parameter like the original endpoint

    // TODO: Handle referral claims in public mode if needed
    // For now, we'll skip claim processing to keep it simple

    // Get user data for this fingerprint - match original /v1/me format exactly
    const [fingerprintRecord, lead, usage] = await Promise.all([
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

    // Calculate total credits
    const totalCredits = fingerprintRecord.credits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    );

    // Get app settings including waitlist configuration
    const appSettings = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        creditsPaused: true,
        policyJson: true,
        waitlistEnabled: true,
        waitlistEnabledAt: true,
        waitlistMessage: true,
      },
    });

    // Check if user should be grandfathered
    let isGrandfathered = false;
    if (appSettings?.waitlistEnabled && appSettings.waitlistEnabledAt) {
      isGrandfathered = fingerprintRecord.createdAt < appSettings.waitlistEnabledAt;
    }

    // Check waitlist status
    let waitlistData = null;
    if (appSettings?.waitlistEnabled) {
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
              requiresWaitlist: true,
            };
          } else {
            // No waitlist entry yet
            waitlistData = {
              enabled: true,
              status: 'none',
              position: null,
              requiresWaitlist: true,
              message: appSettings.waitlistMessage || 'Join our exclusive waitlist for early access',
            };
          }
        } else {
          // No email registered yet
          waitlistData = {
            enabled: true,
            status: 'none',
            position: null,
            requiresWaitlist: true,
            message: appSettings.waitlistMessage || 'Join our exclusive waitlist for early access',
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
      creditsPaused: appSettings?.creditsPaused || false,
      // User profile data (flat structure to match original)
      name: lead?.name || null,
      email: lead?.email || null,
      hasClaimedName: !!lead?.name,
      hasClaimedEmail: !!lead?.email,
      hasVerifiedEmail: lead?.emailVerified || false,
      // Use actual policy from app
      policy: appSettings?.policyJson,
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
