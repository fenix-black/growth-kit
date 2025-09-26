import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errors.unauthorized();
    }

    const token = authHeader.substring(7);
    const expectedToken = process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025';
    
    if (token !== expectedToken) {
      return errors.forbidden();
    }

    const { id } = await params;

    // Fetch app details
    const app = await prisma.app.findUnique({
      where: {
        id,
      },
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
    });

    if (!app) {
      return errors.notFound();
    }

    // Calculate today's USD spending if USD tracking is enabled
    let todayUsdSpent = 0;
    if (app.trackUsdValue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUsages = await prisma.usage.aggregate({
        where: {
          fingerprint: {
            appId: id
          },
          createdAt: {
            gte: today
          },
          usdValue: {
            not: null
          }
        },
        _sum: {
          usdValue: true
        }
      });
      
      todayUsdSpent = todayUsages._sum.usdValue ? parseFloat(todayUsages._sum.usdValue.toString()) : 0;
    }

    // Map database field names to client field names for compatibility
    const clientApp = {
      ...app,
      autoApproveWaitlist: app.autoInviteEnabled,
      invitationQuota: app.dailyInviteQuota,
      invitationCronTime: app.inviteTime,
      todayUsdSpent,
    };

    return successResponse({ app: clientApp });
  } catch (error) {
    console.error('Error fetching app:', error);
    return errors.serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errors.unauthorized();
    }

    const token = authHeader.substring(7);
    const expectedToken = process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025';
    
    if (token !== expectedToken) {
      return errors.forbidden();
    }

    const { id } = await params;
    const body = await request.json();

    // Validate and filter allowed fields with proper mapping
    const fieldMapping: { [key: string]: string } = {
      'name': 'name',
      'domain': 'domain',
      'isActive': 'isActive',
      'corsOrigins': 'corsOrigins',
      'redirectUrl': 'redirectUrl',
      'policyJson': 'policyJson',
      'waitlistEnabled': 'waitlistEnabled',
      'autoApproveWaitlist': 'autoInviteEnabled',  // Map to correct field name
      'invitationQuota': 'dailyInviteQuota',        // Map to correct field name
      'invitationCronTime': 'inviteTime',           // Map to correct field name
      'trackUsdValue': 'trackUsdValue',
      'creditsPaused': 'creditsPaused',
      'allowCustomCredits': 'allowCustomCredits',
      'maxCustomCredits': 'maxCustomCredits'
    };
    
    const updateData: any = {};
    for (const [clientField, dbField] of Object.entries(fieldMapping)) {
      if (body[clientField] !== undefined) {
        updateData[dbField] = body[clientField];
      }
    }
    
    // Basic type validation on the mapped fields
    if (updateData.name !== undefined && typeof updateData.name !== 'string') {
      return errors.badRequest('Invalid name');
    }
    if (updateData.domain !== undefined && typeof updateData.domain !== 'string') {
      return errors.badRequest('Invalid domain');
    }
    if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') {
      return errors.badRequest('Invalid isActive value');
    }
    if (updateData.corsOrigins !== undefined && !Array.isArray(updateData.corsOrigins)) {
      return errors.badRequest('Invalid corsOrigins');
    }
    if (updateData.redirectUrl !== undefined && typeof updateData.redirectUrl !== 'string') {
      return errors.badRequest('Invalid redirectUrl');
    }
    if (updateData.waitlistEnabled !== undefined && typeof updateData.waitlistEnabled !== 'boolean') {
      return errors.badRequest('Invalid waitlistEnabled value');
    }
    if (updateData.autoInviteEnabled !== undefined && typeof updateData.autoInviteEnabled !== 'boolean') {
      return errors.badRequest('Invalid autoApproveWaitlist value');
    }
    if (updateData.dailyInviteQuota !== undefined && typeof updateData.dailyInviteQuota !== 'number') {
      return errors.badRequest('Invalid invitationQuota');
    }
    if (updateData.inviteTime !== undefined && typeof updateData.inviteTime !== 'string') {
      return errors.badRequest('Invalid invitationCronTime');
    }
    if (updateData.trackUsdValue !== undefined && typeof updateData.trackUsdValue !== 'boolean') {
      return errors.badRequest('Invalid trackUsdValue');
    }
    if (updateData.creditsPaused !== undefined && typeof updateData.creditsPaused !== 'boolean') {
      return errors.badRequest('Invalid creditsPaused');
    }
    if (updateData.allowCustomCredits !== undefined && typeof updateData.allowCustomCredits !== 'boolean') {
      return errors.badRequest('Invalid allowCustomCredits');
    }
    if (updateData.maxCustomCredits !== undefined) {
      const maxCredits = parseInt(updateData.maxCustomCredits);
      if (isNaN(maxCredits) || maxCredits < 1 || maxCredits > 1000) {
        return errors.badRequest('Invalid maxCustomCredits: must be between 1 and 1000');
      }
      updateData.maxCustomCredits = maxCredits;
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

    // Handle creditsPaused timestamp
    if (updateData.creditsPaused !== undefined) {
      const currentApp = await prisma.app.findUnique({
        where: { id },
        select: { creditsPaused: true }
      });
      
      if (currentApp) {
        if (updateData.creditsPaused === true && !currentApp.creditsPaused) {
          // Pausing credits - set timestamp
          updateData.creditsPausedAt = new Date();
        } else if (updateData.creditsPaused === false && currentApp.creditsPaused) {
          // Resuming credits - clear timestamp
          updateData.creditsPausedAt = null;
        }
      }
    }

    // Update app
    const updatedApp = await prisma.app.update({
      where: { id },
      data: updateData,
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
    });

    // Map database field names to client field names for compatibility
    const clientApp = {
      ...updatedApp,
      autoApproveWaitlist: updatedApp.autoInviteEnabled,
      invitationQuota: updatedApp.dailyInviteQuota,
      invitationCronTime: updatedApp.inviteTime,
    };

    return successResponse({ app: clientApp });
  } catch (error) {
    console.error('Error updating app:', error);
    if ((error as any)?.code === 'P2025') {
      return errors.notFound();
    }
    return errors.serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errors.unauthorized();
    }

    const token = authHeader.substring(7);
    const expectedToken = process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025';
    
    if (token !== expectedToken) {
      return errors.forbidden();
    }

    const { id } = await params;

    // Delete app and all related data (cascade delete)
    await prisma.app.delete({
      where: { id },
    });

    return successResponse({ message: 'App deleted successfully' });
  } catch (error) {
    console.error('Error deleting app:', error);
    if ((error as any)?.code === 'P2025') {
      return errors.notFound();
    }
    return errors.serverError();
  }
}
