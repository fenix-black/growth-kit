import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const period = searchParams.get('period') || 'week';

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Fetch all invitations with codes
    const invitations = await prisma.waitlist.findMany({
      where: {
        appId,
        invitationCode: {
          not: null,
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    // Calculate metrics
    const totalInvitations = invitations.length;
    const sentToday = invitations.filter(inv => {
      const invitedAt = inv.invitedAt ? new Date(inv.invitedAt) : null;
      if (!invitedAt) return false;
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return invitedAt >= today;
    }).length;

    const sentThisWeek = invitations.filter(inv => {
      const invitedAt = inv.invitedAt ? new Date(inv.invitedAt) : null;
      if (!invitedAt) return false;
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return invitedAt >= weekAgo;
    }).length;

    const sentThisMonth = invitations.filter(inv => {
      const invitedAt = inv.invitedAt ? new Date(inv.invitedAt) : null;
      if (!invitedAt) return false;
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return invitedAt >= monthStart;
    }).length;

    // Calculate redemption metrics
    const redeemedInvitations = invitations.filter(inv => inv.useCount && inv.useCount > 0);
    const redemptionRate = totalInvitations > 0 
      ? Math.round((redeemedInvitations.length / totalInvitations) * 100) 
      : 0;

    // Calculate average time to redeem
    let totalRedeemTime = 0;
    let redeemCount = 0;
    redeemedInvitations.forEach(inv => {
      if (inv.invitedAt && inv.codeUsedAt) {
        const timeDiff = new Date(inv.codeUsedAt).getTime() - new Date(inv.invitedAt).getTime();
        totalRedeemTime += timeDiff;
        redeemCount++;
      }
    });

    const avgTimeToRedeemMs = redeemCount > 0 ? totalRedeemTime / redeemCount : 0;
    const avgTimeToRedeem = formatDuration(avgTimeToRedeemMs);

    // Calculate status breakdown
    const now2 = new Date();
    const invitationsByStatus = {
      pending: invitations.filter(inv => 
        inv.status === 'INVITED' && 
        (!inv.useCount || inv.useCount === 0) &&
        (!inv.codeExpiresAt || new Date(inv.codeExpiresAt) > now2)
      ).length,
      sent: invitations.filter(inv => inv.status === 'INVITED').length,
      opened: 0, // This would require email tracking
      clicked: 0, // This would require link tracking
      redeemed: invitations.filter(inv => inv.useCount && inv.useCount > 0).length,
      expired: invitations.filter(inv => 
        inv.codeExpiresAt && new Date(inv.codeExpiresAt) <= now2 && 
        (!inv.useCount || inv.useCount === 0)
      ).length,
    };

    // Get recent invitations based on period
    const recentInvitations = invitations
      .filter(inv => {
        const invitedAt = inv.invitedAt ? new Date(inv.invitedAt) : null;
        return invitedAt && invitedAt >= startDate;
      })
      .slice(0, 20) // Limit to 20 most recent
      .map(inv => ({
        id: inv.id,
        email: inv.email,
        code: inv.invitationCode || '',
        status: getInvitationStatus(inv),
        sentAt: inv.invitedAt?.toISOString() || '',
        redeemedAt: inv.codeUsedAt?.toISOString(),
        expiresAt: inv.codeExpiresAt?.toISOString() || '',
        useCount: inv.useCount || 0,
        maxUses: inv.maxUses || 1,
      }));

    return successResponse({
      totalInvitations,
      sentToday,
      sentThisWeek,
      sentThisMonth,
      redemptionRate,
      avgTimeToRedeem,
      invitationsByStatus,
      recentInvitations,
    });
  } catch (error) {
    console.error('Error fetching invitation metrics:', error);
    return errors.serverError();
  }
}

function formatDuration(ms: number): string {
  if (ms === 0) return 'N/A';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

function getInvitationStatus(invitation: any): string {
  const now = new Date();
  
  if (invitation.useCount && invitation.useCount > 0) {
    return 'redeemed';
  }
  
  if (invitation.codeExpiresAt && new Date(invitation.codeExpiresAt) <= now) {
    return 'expired';
  }
  
  if (invitation.status === 'INVITED') {
    return 'pending';
  }
  
  return 'unknown';
}
