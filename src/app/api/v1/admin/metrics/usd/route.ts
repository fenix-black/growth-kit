import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errors.unauthorized();
    }

    const token = authHeader.substring(7);
    const serviceKey = process.env.SERVICE_KEY;

    if (!serviceKey || token !== serviceKey) {
      return errors.unauthorized();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId');
    const period = searchParams.get('period') || 'all'; // all, daily, weekly, monthly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'user'; // user, action, day, week, month

    // Validate app exists if specified
    if (appId) {
      const app = await prisma.app.findUnique({
        where: { id: appId },
      });

      if (!app) {
        return errors.notFound('App not found');
      }

      if (!app.trackUsdValue) {
        return errors.badRequest('USD tracking is not enabled for this app');
      }
    }

    // Build date filters
    const dateFilters: any = {};
    const now = new Date();

    if (period === 'daily') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      dateFilters.createdAt = { gte: today };
    } else if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      dateFilters.createdAt = { gte: weekAgo };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      dateFilters.createdAt = { gte: monthAgo };
    } else if (startDate || endDate) {
      dateFilters.createdAt = {};
      if (startDate) {
        dateFilters.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilters.createdAt.lte = new Date(endDate);
      }
    }

    // Build where clause
    const whereClause: any = {
      usdValue: { not: null },
      ...dateFilters,
    };

    if (appId) {
      whereClause.fingerprint = {
        appId,
      };
    }

    // Fetch USD metrics based on grouping
    let metrics: any = {};

    if (groupBy === 'user') {
      // Group by user (fingerprint)
      const userMetrics = await prisma.usage.groupBy({
        by: ['fingerprintId'],
        where: whereClause,
        _sum: {
          usdValue: true,
        },
        _count: {
          id: true,
        },
      });

      // Get fingerprint details
      const fingerprintIds = userMetrics.map(m => m.fingerprintId);
      const fingerprints = await prisma.fingerprint.findMany({
        where: { id: { in: fingerprintIds } },
        include: {
          leads: {
            select: { email: true, name: true }
          }
        }
      });

      const fingerprintMap = new Map(fingerprints.map(fp => [fp.id, fp]));

      metrics.byUser = userMetrics
        .map(m => {
          const fp = fingerprintMap.get(m.fingerprintId);
          return {
            fingerprintId: m.fingerprintId,
            referralCode: fp?.referralCode,
            email: fp?.leads[0]?.email,
            name: fp?.leads[0]?.name,
            totalSpent: m._sum.usdValue ? parseFloat(m._sum.usdValue.toString()) : 0,
            transactionCount: m._count.id,
            avgTransactionValue: m._sum.usdValue && m._count.id > 0 
              ? parseFloat(m._sum.usdValue.toString()) / m._count.id 
              : 0,
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (groupBy === 'action') {
      // Group by action type
      const actionMetrics = await prisma.usage.groupBy({
        by: ['action'],
        where: whereClause,
        _sum: {
          usdValue: true,
        },
        _count: {
          id: true,
        },
      });

      metrics.byAction = actionMetrics.map(m => ({
        action: m.action,
        totalRevenue: m._sum.usdValue ? parseFloat(m._sum.usdValue.toString()) : 0,
        transactionCount: m._count.id,
        avgTransactionValue: m._sum.usdValue && m._count.id > 0
          ? parseFloat(m._sum.usdValue.toString()) / m._count.id
          : 0,
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (groupBy === 'day' || groupBy === 'week' || groupBy === 'month') {
      // Time-based grouping (requires raw SQL for date truncation)
      const usages = await prisma.usage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        select: {
          usdValue: true,
          createdAt: true,
        }
      });

      const timeGroups = new Map<string, { revenue: number; count: number }>();

      for (const usage of usages) {
        if (!usage.usdValue) continue;

        let key: string;
        const date = new Date(usage.createdAt);

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        const current = timeGroups.get(key) || { revenue: 0, count: 0 };
        current.revenue += parseFloat(usage.usdValue.toString());
        current.count += 1;
        timeGroups.set(key, current);
      }

      metrics.timeline = Array.from(timeGroups.entries())
        .map(([period, data]) => ({
          period,
          revenue: Math.round(data.revenue * 100) / 100,
          transactionCount: data.count,
          avgTransactionValue: Math.round((data.revenue / data.count) * 100) / 100,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }

    // Calculate overall statistics
    const overallStats = await prisma.usage.aggregate({
      where: whereClause,
      _sum: {
        usdValue: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        usdValue: true,
      },
      _min: {
        usdValue: true,
      },
      _max: {
        usdValue: true,
      },
    });

    // Count unique users
    const uniqueUsers = await prisma.usage.findMany({
      where: whereClause,
      distinct: ['fingerprintId'],
      select: { fingerprintId: true },
    });

    const summary = {
      totalRevenue: overallStats._sum.usdValue ? parseFloat(overallStats._sum.usdValue.toString()) : 0,
      totalTransactions: overallStats._count.id,
      uniqueUsers: uniqueUsers.length,
      avgTransactionValue: overallStats._avg.usdValue ? parseFloat(overallStats._avg.usdValue.toString()) : 0,
      minTransactionValue: overallStats._min.usdValue ? parseFloat(overallStats._min.usdValue.toString()) : 0,
      maxTransactionValue: overallStats._max.usdValue ? parseFloat(overallStats._max.usdValue.toString()) : 0,
      avgUserValue: uniqueUsers.length > 0 && overallStats._sum.usdValue
        ? parseFloat(overallStats._sum.usdValue.toString()) / uniqueUsers.length
        : 0,
    };

    // Round all monetary values to 2 decimal places
    for (const key of Object.keys(summary)) {
      if (key.includes('Value') || key.includes('Revenue')) {
        summary[key as keyof typeof summary] = Math.round(summary[key as keyof typeof summary] * 100) / 100;
      }
    }

    return successResponse({
      summary,
      ...metrics,
      filters: {
        appId,
        period,
        startDate,
        endDate,
        groupBy,
      },
    });
  } catch (error) {
    console.error('Error in /v1/admin/metrics/usd:', error);
    return errors.serverError();
  }
}

// Export endpoint for CSV download
export async function POST(request: NextRequest) {
  try {
    // Verify service key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errors.unauthorized();
    }

    const token = authHeader.substring(7);
    const serviceKey = process.env.SERVICE_KEY;

    if (!serviceKey || token !== serviceKey) {
      return errors.unauthorized();
    }

    // Parse request body
    const body = await request.json();
    const { appId, startDate, endDate } = body;

    // Build where clause
    const whereClause: any = {
      usdValue: { not: null },
    };

    if (appId) {
      whereClause.fingerprint = { appId };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch all usage records with USD values
    const usages = await prisma.usage.findMany({
      where: whereClause,
      include: {
        fingerprint: {
          include: {
            leads: {
              select: { email: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format as CSV
    const headers = ['Date', 'Time', 'Fingerprint ID', 'Name', 'Email', 'Action', 'USD Value', 'App ID'];
    const rows = usages.map(u => {
      const date = new Date(u.createdAt);
      return [
        date.toISOString().split('T')[0],
        date.toTimeString().split(' ')[0],
        u.fingerprintId,
        u.fingerprint.leads[0]?.name || '',
        u.fingerprint.leads[0]?.email || '',
        u.action,
        u.usdValue?.toString() || '0',
        u.fingerprint.appId,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="usd-metrics-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting USD metrics:', error);
    return errors.serverError();
  }
}
