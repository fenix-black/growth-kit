import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
import { corsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin, ['*']);
  return new Response(null, { status: 200, headers });
}

export async function GET(request: NextRequest) {
  try {
    // Verify app authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const eventName = searchParams.get('eventName');
    const fingerprintId = searchParams.get('fingerprintId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = { appId: authContext.app.id };
    
    if (eventName) {
      where.eventName = eventName;
    }
    
    if (fingerprintId) {
      where.fingerprintId = fingerprintId;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Fetch activities with pagination
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          fingerprint: {
            include: {
              leads: {
                where: {
                  emailVerified: true,
                },
                select: {
                  email: true,
                  name: true,
                },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return new Response(
      JSON.stringify({
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching activities:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders(request.headers.get('origin'), ['*']), 'Content-Type': 'application/json' },
      }
    );
  }
}
