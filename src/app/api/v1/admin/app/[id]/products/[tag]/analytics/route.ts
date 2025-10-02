import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { findProductByTag } from '@/lib/types/product-waitlist';

/**
 * GET /api/v1/admin/app/:appId/products/:tag/analytics
 * Returns analytics for a specific product waitlist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tag: string }> }
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: appId, tag } = await params;

    // Verify product exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { metadata: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const product = findProductByTag(app.metadata, tag);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get status breakdown
    const statusCounts = await prisma.waitlist.groupBy({
      by: ['status'],
      where: {
        appId,
        productTag: tag,
      } as any,
      _count: true,
    });

    const byStatus = {
      WAITING: 0,
      INVITED: 0,
      ACCEPTED: 0,
    };

    statusCounts.forEach((c: any) => {
      byStatus[c.status as keyof typeof byStatus] = c._count;
    });

    const total = byStatus.WAITING + byStatus.INVITED + byStatus.ACCEPTED;

    // Get timeline data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const signupsByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM waitlist
      WHERE 
        app_id = ${appId}
        AND product_tag = ${tag}
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const timeline: Record<string, number> = {};
    (signupsByDay as any[]).forEach(row => {
      const date = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      timeline[date] = Number(row.count);
    });

    // Calculate conversion rate
    const conversionRate = byStatus.INVITED > 0 
      ? byStatus.ACCEPTED / byStatus.INVITED 
      : 0;

    const analytics = {
      total,
      byStatus,
      timeline,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };

    // Cache for 15 minutes
    const response = NextResponse.json({
      success: true,
      data: { analytics },
    });

    response.headers.set('Cache-Control', 'public, max-age=900');

    return response;

  } catch (error) {
    console.error('Product analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

