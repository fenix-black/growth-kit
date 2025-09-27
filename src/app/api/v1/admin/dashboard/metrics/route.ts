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

    // Fetch all data in parallel
    const [
      currentPeriodUsers,
      previousPeriodUsers,
      totalCreditsIssued,
      totalCreditsConsumed,
      creditsDistribution,
      topEvents,
      recentActivities
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
      
      // Recent activities across all apps
      prisma.activity.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
        include: {
          app: {
            select: { name: true }
          },
          fingerprint: {
            include: {
              leads: {
                where: { emailVerified: true },
                select: { email: true, name: true },
                take: 1
              }
            }
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
      (sum, item) => sum + (item._sum.amount || 0), 
      0
    );
    
    const formattedCreditsDistribution = creditsDistribution.map(item => ({
      reason: item.reason,
      count: item._sum.amount || 0,
      percentage: totalCreditsInDistribution > 0 
        ? ((item._sum.amount || 0) / totalCreditsInDistribution) * 100 
        : 0
    }));

    // Format top events
    const formattedTopEvents = topEvents.map(event => ({
      eventName: event.eventName,
      count: event._count
    }));

    // Format recent activities
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      eventName: activity.eventName,
      appName: activity.app.name,
      timestamp: activity.timestamp,
      user: activity.fingerprint.leads[0]?.email || 
            activity.fingerprint.leads[0]?.name || 
            `User ${activity.fingerprintId.substring(0, 8)}`
    }));

    // System health metrics
    const memoryUsage = process.memoryUsage();
    const systemHealth = {
      cpu: Math.random() * 30 + 40, // TODO: Implement real CPU tracking
      memory: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      creditsUtilization: Math.min(creditsUtilization, 100)
    };

    return successResponse({
      growth: {
        rate: parseFloat(growthRate.toFixed(2)),
        currentPeriodUsers,
        previousPeriodUsers
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
