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
    const appId = searchParams.get('appId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const eventName = searchParams.get('eventName');
    const fingerprintValue = searchParams.get('fingerprintId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    // If fingerprint value provided, look up the ID
    let fingerprintId: string | undefined;
    if (fingerprintValue) {
      const fingerprint = await prisma.fingerprint.findUnique({
        where: { 
          appId_fingerprint: {
            appId,
            fingerprint: fingerprintValue
          }
        },
      });
      if (fingerprint) {
        fingerprintId = fingerprint.id;
      }
    }

    // Build where clause
    const where: any = { appId };
    
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

    return successResponse({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return errors.serverError();
  }
}
