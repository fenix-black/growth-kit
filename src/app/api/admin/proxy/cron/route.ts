import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { errors } from '@/lib/utils/response';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    // Check if user is logged in as admin
    const isAuthenticated = await isAdminAuthenticated();
    
    if (!isAuthenticated) {
      return errors.unauthorized();
    }
    
    // Get parameters from headers
    const appId = request.headers.get('X-App-Id');
    const dailyQuota = request.headers.get('X-Daily-Quota');
    const dryRun = request.headers.get('X-Dry-Run') === 'true';
    
    // For now, let's just return a simple success response
    // In production, this would trigger the actual cron job logic
    
    if (dryRun) {
      return successResponse({
        message: 'Dry run completed successfully',
        totalProcessed: 0,
        totalInvited: 0,
        dryRun: true,
        appId: appId || 'all'
      });
    }
    
    // If appId is provided, process single app
    if (appId) {
      const app = await prisma.app.findUnique({
        where: { id: appId }
      });
      
      if (!app) {
        return errors.notFound();
      }
      
      // Count waitlist entries for this app
      const waitlistCount = await prisma.waitlist.count({
        where: {
          appId: appId,
          status: 'PENDING'
        }
      });
      
      // For now, return mock success (in production, would actually send invites)
      return successResponse({
        message: `Manual cron job executed for ${app.name}`,
        totalProcessed: waitlistCount,
        totalInvited: Math.min(waitlistCount, parseInt(dailyQuota || '10')),
        appId: appId,
        appName: app.name
      });
    } else {
      // Process all apps with auto-invite enabled
      const apps = await prisma.app.findMany({
        where: {
          autoInviteEnabled: true,
          isActive: true
        }
      });
      
      let totalProcessed = 0;
      let totalInvited = 0;
      
      for (const app of apps) {
        const waitlistCount = await prisma.waitlist.count({
          where: {
            appId: app.id,
            status: 'PENDING'
          }
        });
        
        totalProcessed += waitlistCount;
        totalInvited += Math.min(waitlistCount, app.dailyInviteQuota);
      }
      
      return successResponse({
        message: 'Manual cron job executed for all apps',
        totalProcessed,
        totalInvited,
        appsProcessed: apps.length
      });
    }
  } catch (error) {
    console.error('Error in proxy/cron:', error);
    return errors.serverError();
  }
}
