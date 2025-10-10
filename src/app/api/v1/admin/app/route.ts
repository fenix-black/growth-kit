import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';
import { generateApiKey, hashApiKey, generatePublicKey } from '@/lib/security/apiKeys';
import { trackAdminActivity } from '@/lib/admin-activity-tracking';

export async function POST(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse request body
    const body = await request.json();
    const { 
      id,
      name, 
      domain, 
      description,
      logoUrl,
      primaryColor,
      waitlistLayout = 'centered',
      corsOrigins = [], 
      redirectUrl, 
      policyJson,
      isActive = true,
      isolatedAccounts = true
    } = body;

    if (!name || !domain || !redirectUrl || !policyJson) {
      return errors.badRequest('Missing required fields: name, domain, redirectUrl, policyJson');
    }

    // Validate policy JSON structure
    const requiredPolicyFields = [
      'referralCredits',
      'referredCredits',
      'nameClaimCredits',
      'emailClaimCredits',
      'emailVerifyCredits',
      'dailyReferralCap',
      'actions'
    ];

    for (const field of requiredPolicyFields) {
      if (!(field in policyJson)) {
        return errors.badRequest(`Policy JSON missing required field: ${field}`);
      }
    }

    let app;
    
    if (id) {
      // Update existing app
      app = await prisma.app.update({
        where: { id },
        data: {
          name,
          domain,
          description,
          logoUrl,
          primaryColor,
          waitlistLayout,
          corsOrigins,
          redirectUrl,
          policyJson,
          isActive,
          isolatedAccounts,
        },
      });
    } else {
      // Create new app with public key
      const publicKey = generatePublicKey();
      
      app = await prisma.app.create({
        data: {
          name,
          domain,
          description,
          logoUrl,
          primaryColor,
          waitlistLayout,
          corsOrigins,
          redirectUrl,
          policyJson,
          isActive,
          isolatedAccounts,
          publicKey, // Generate public key for client-side usage
        } as any,
      });

      // Log event
      await prisma.eventLog.create({
        data: {
          appId: app.id,
          event: 'app.created',
          entityType: 'app',
          entityId: app.id,
          metadata: { name, domain },
        },
      });

      // Track admin activity
      await trackAdminActivity({
        action: 'app_created',
        targetType: 'app',
        targetId: app.id,
        metadata: { name, domain }
      });

      // Return the app with the initial public key
      return successResponse({
        app,
        publicKey,
        message: 'App created successfully. Public key is available in the API Tokens tab.',
      }, 201);
    }

    // Log update event
    await prisma.eventLog.create({
      data: {
        appId: app.id,
        event: 'app.updated',
        entityType: 'app',
        entityId: app.id,
        metadata: { name, domain },
      },
    });

    // Track admin activity
    await trackAdminActivity({
      action: 'app_updated',
      targetType: 'app',
      targetId: app.id,
      metadata: { name, domain }
    });

    return successResponse({
      app,
      message: 'App updated successfully',
    });
  } catch (error) {
    console.error('Error in /v1/admin/app:', error);
    return errors.serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse request body
    const body = await request.json();
    const { 
      id,
      name,
      domain,
      isActive,
      corsOrigins,
      redirectUrl,
      policyJson,
      waitlistEnabled,
      waitlistMessages,
      waitlistLayout,
      description,
      logoUrl,
      primaryColor,
      backgroundColor,
      cardBackgroundColor,
      hideGrowthKitBranding,
      autoInviteEnabled,
      dailyInviteQuota,
      inviteTime,
      masterReferralCode,
      masterReferralCredits,
      trackUsdValue,
      allowCustomCredits,
      maxCustomCredits,
      initialCreditsPerDay,
      creditsPaused,
      isolatedAccounts,
      autoApproveWaitlist,
      invitationQuota,
      invitationCronTime,
      metadata,
    } = body;

    if (!id) {
      return errors.badRequest('App ID is required');
    }

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (corsOrigins !== undefined) updateData.corsOrigins = corsOrigins;
    if (redirectUrl !== undefined) updateData.redirectUrl = redirectUrl;
    if (policyJson !== undefined) updateData.policyJson = policyJson;
    if (waitlistEnabled !== undefined) updateData.waitlistEnabled = waitlistEnabled;
    if (waitlistMessages !== undefined) updateData.waitlistMessages = waitlistMessages;
    if (waitlistLayout !== undefined) updateData.waitlistLayout = waitlistLayout;
    if (description !== undefined) updateData.description = description;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (cardBackgroundColor !== undefined) updateData.cardBackgroundColor = cardBackgroundColor;
    if (hideGrowthKitBranding !== undefined) updateData.hideGrowthKitBranding = hideGrowthKitBranding;
    if (autoInviteEnabled !== undefined) updateData.autoInviteEnabled = autoInviteEnabled;
    if (dailyInviteQuota !== undefined) updateData.dailyInviteQuota = dailyInviteQuota;
    if (inviteTime !== undefined) updateData.inviteTime = inviteTime;
    if (masterReferralCode !== undefined) updateData.masterReferralCode = masterReferralCode;
    if (masterReferralCredits !== undefined) updateData.masterReferralCredits = masterReferralCredits;
    if (trackUsdValue !== undefined) updateData.trackUsdValue = trackUsdValue;
    if (allowCustomCredits !== undefined) updateData.allowCustomCredits = allowCustomCredits;
    if (maxCustomCredits !== undefined) updateData.maxCustomCredits = maxCustomCredits;
    if (initialCreditsPerDay !== undefined) updateData.initialCreditsPerDay = initialCreditsPerDay;
    if (creditsPaused !== undefined) updateData.creditsPaused = creditsPaused;
    if (isolatedAccounts !== undefined) updateData.isolatedAccounts = isolatedAccounts;
    if (autoApproveWaitlist !== undefined) updateData.autoApproveWaitlist = autoApproveWaitlist;
    if (invitationQuota !== undefined) updateData.invitationQuota = invitationQuota;
    if (invitationCronTime !== undefined) updateData.invitationCronTime = invitationCronTime;

    // Handle metadata - merge with existing
    if (metadata !== undefined) {
      const existingApp = await prisma.app.findUnique({
        where: { id },
        select: { metadata: true },
      });

      updateData.metadata = {
        ...(existingApp?.metadata as any || {}),
        ...metadata,
      };
    }

    // Check if waitlist is being enabled (false -> true)
    if (updateData.waitlistEnabled === true) {
      const currentApp = await prisma.app.findUnique({
        where: { id },
        select: { waitlistEnabled: true }
      });
      
      if (currentApp && !currentApp.waitlistEnabled) {
        // Waitlist is being enabled (was disabled, now enabled)
        // Always update the timestamp when re-enabling
        updateData.waitlistEnabledAt = new Date();
      }
    }

    // Update app configuration
    const app = await prisma.app.update({
      where: { id },
      data: updateData,
    });

    return successResponse({
      success: true,
      app,
    });
  } catch (error: any) {
    console.error('Error updating app:', error);
    
    if (error?.code === 'P2002') {
      return errors.badRequest('Master referral code already exists for another app');
    }
    
    return errors.serverError();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Get all apps
    const apps = await prisma.app.findMany({
      include: {
        _count: {
          select: {
            apiKeys: true,
            fingerprints: true,
            referrals: true,
            leads: true,
            waitlist: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ apps });
  } catch (error) {
    console.error('Error in /v1/admin/app GET:', error);
    return errors.serverError();
  }
}
