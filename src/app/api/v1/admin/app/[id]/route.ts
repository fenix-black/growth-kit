import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch app details
    const app = await prisma.app.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            apiKeys: true,
            fingerprints: true,
            referrals: true,
            leads: true,
            waitlist: true,
          },
        },
      },
    });

    if (!app) {
      return errors.notFound();
    }

    return successResponse({ app });
  } catch (error) {
    console.error('Error fetching app:', error);
    return errors.serverError();
  }
}
