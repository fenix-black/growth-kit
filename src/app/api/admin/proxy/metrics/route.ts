import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { errors } from '@/lib/utils/response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in as admin
    const isAuthenticated = await isAdminAuthenticated();
    
    if (!isAuthenticated) {
      return errors.unauthorized();
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const event = searchParams.get('event');
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Build where clause
    let where: any = {};
    
    if (appId && appId !== 'all') {
      where.appId = appId;
    }
    
    if (event) {
      where.event = event;
    }
    
    // Calculate date range
    const now = new Date();
    let dateFilter = undefined;
    
    if (timeRange === '24h') {
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === '7d') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    if (dateFilter) {
      where.createdAt = { gte: dateFilter };
    }
    
    // Query event logs
    const events = await prisma.eventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        app: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Error in proxy/metrics:', error);
    return errors.serverError();
  }
}
