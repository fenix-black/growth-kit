import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate date ranges
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // Calculate dates for time series
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all data in parallel
    const [
      currentPeriodUsers,
      previousPeriodUsers,
      totalCreditsIssued,
      totalCreditsConsumed,
      creditsDistribution,
      topEvents,
      recentActivities,
      todayUsers,
      yesterdayUsers,
      todayReferrals,
      yesterdayReferrals,
      todayWaitlist,
      yesterdayWaitlist
    ] = await Promise.all([
      // Current period new users
      prisma.fingerprint.count({
        where: {
          createdAt: { gte: currentPeriodStart }
        }
      }),
      
      // Previous period new users
      prisma.fingerprint.count({
        where: {
          createdAt: { 
            gte: previousPeriodStart,
            lt: currentPeriodStart 
          }
        }
      }),
      
      // Total credits issued
      prisma.credit.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true }
      }),
      
      // Total credits consumed (negative amounts)
      prisma.credit.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true }
      }),
      
      // Credits distribution by reason
      prisma.credit.groupBy({
        by: ['reason'],
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
        _count: true,
        orderBy: {
          _sum: { amount: 'desc' }
        }
      }),
      
      // Top events for "conversion funnel" bar chart
      prisma.activity.groupBy({
        by: ['eventName'],
        where: {
          timestamp: { gte: currentPeriodStart }
        },
        _count: true,
        orderBy: {
          _count: { eventName: 'desc' }
        },
        take: 5
      }),
      
      // Recent admin activities
      prisma.adminActivity.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' }
      }),
      
      // Today's new users
      prisma.fingerprint.count({
        where: {
          createdAt: { 
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Yesterday's new users
      prisma.fingerprint.count({
        where: {
          createdAt: { 
            gte: yesterday,
            lt: today
          }
        }
      }),
      
      // Today's referrals
      prisma.referral.count({
        where: {
          createdAt: { 
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Yesterday's referrals
      prisma.referral.count({
        where: {
          createdAt: { 
            gte: yesterday,
            lt: today
          }
        }
      }),
      
      // Today's waitlist
      prisma.waitlist.count({
        where: {
          createdAt: { 
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Yesterday's waitlist
      prisma.waitlist.count({
        where: {
          createdAt: { 
            gte: yesterday,
            lt: today
          }
        }
      })
    ]);

    // Calculate growth rate
    const growthRate = previousPeriodUsers > 0 
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : 0;

    // Calculate credits utilization
    const totalIssued = totalCreditsIssued._sum.amount || 0;
    const totalConsumed = Math.abs(totalCreditsConsumed._sum.amount || 0);
    const creditsUtilization = totalIssued > 0 ? (totalConsumed / totalIssued) * 100 : 0;

    // Format credits distribution
    const totalCreditsInDistribution = creditsDistribution.reduce(
      (sum: number, item: any) => sum + (item._sum.amount || 0), 
      0
    );
    
    const formattedCreditsDistribution = creditsDistribution.map((item: any) => ({
      reason: item.reason,
      count: item._sum.amount || 0,
      percentage: totalCreditsInDistribution > 0 
        ? ((item._sum.amount || 0) / totalCreditsInDistribution) * 100 
        : 0
    }));

    // Format top events
    const formattedTopEvents = topEvents.map((event: any) => ({
      eventName: event.eventName,
      count: event._count
    }));

    // Format recent activities
    const formattedActivities = recentActivities.map((activity: any) => {
      // Format action for display
      const actionLabels: Record<string, string> = {
        'app_created': 'Created app',
        'app_updated': 'Updated app'
      };
      
      return {
        id: activity.id,
        eventName: actionLabels[activity.action] || activity.action,
        appName: activity.metadata?.name || activity.targetId || '',
        timestamp: activity.timestamp,
        user: 'Admin'
      };
    });

    // System health metrics
    const memoryUsage = process.memoryUsage();
    const systemHealth = {
      cpu: Math.random() * 30 + 40, // TODO: Implement real CPU tracking
      memory: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      creditsUtilization: Math.min(creditsUtilization, 100)
    };

    // Format growth time series data
    const growthTimeSeries = [
      {
        date: yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: yesterdayUsers,
        referrals: yesterdayReferrals,
        waitlist: yesterdayWaitlist
      },
      {
        date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: todayUsers,
        referrals: todayReferrals,
        waitlist: todayWaitlist
      }
    ];

    return successResponse({
      growth: {
        rate: parseFloat(growthRate.toFixed(2)),
        currentPeriodUsers,
        previousPeriodUsers,
        timeSeries: growthTimeSeries
      },
      credits: {
        distribution: formattedCreditsDistribution,
        totalIssued,
        totalConsumed,
        utilization: parseFloat(creditsUtilization.toFixed(2))
      },
      topEvents: formattedTopEvents,
      systemHealth,
      recentActivity: formattedActivities,
      period: {
        timeRange,
        days,
        startDate: currentPeriodStart.toISOString(),
        endDate: now.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return errors.serverError();
  }
}
