import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { getProductWaitlists } from '@/lib/types/product-waitlist';

/**
 * GET /api/v1/admin/app/:appId/analytics/products
 * Returns aggregate analytics across all product waitlists
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: appId } = await params;

    // Get app with metadata
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { metadata: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const products = getProductWaitlists(app.metadata);

    // Get aggregate stats for all products
    const productStats = await Promise.all(
      products.map(async (product) => {
        const counts = await prisma.waitlist.groupBy({
          by: ['status'],
          where: {
            appId,
            productTag: product.tag,
          } as any,
          _count: true,
        });

        const byStatus = {
          WAITING: 0,
          INVITED: 0,
          ACCEPTED: 0,
        };

        counts.forEach((c: any) => {
          byStatus[c.status as keyof typeof byStatus] = c._count;
        });

        const total = byStatus.WAITING + byStatus.INVITED + byStatus.ACCEPTED;

        return {
          tag: product.tag,
          name: product.name,
          total,
          waiting: byStatus.WAITING,
          invited: byStatus.INVITED,
          accepted: byStatus.ACCEPTED,
        };
      })
    );

    // Sort by total signups (most popular first)
    const sortedStats = productStats.sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        products: sortedStats,
        totalProducts: products.length,
        totalSignups: sortedStats.reduce((sum, p) => sum + p.total, 0),
      },
    });

  } catch (error) {
    console.error('Aggregate products analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

