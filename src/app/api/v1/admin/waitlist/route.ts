import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
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

    // Get appId from query params
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    // Fetch waitlist entries
    const entries = await prisma.waitlist.findMany({
      where: {
        appId,
      },
      orderBy: [
        { status: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return successResponse({
      entries,
    });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return errors.serverError();
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { appId, email } = body;

    if (!appId || !email) {
      return errors.badRequest('appId and email are required');
    }

    // Check if already on waitlist
    const existing = await prisma.waitlist.findUnique({
      where: {
        appId_email: {
          appId,
          email,
        },
      },
    });

    if (existing) {
      return errors.badRequest('Email already on waitlist');
    }

    // Get the next position
    const lastInQueue = await prisma.waitlist.findFirst({
      where: {
        appId,
        status: 'WAITING',
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    const position = (lastInQueue?.position || 0) + 1;

    // Add to waitlist
    const entry = await prisma.waitlist.create({
      data: {
        appId,
        email,
        position,
        status: 'WAITING',
      },
    });

    return successResponse({ entry });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return errors.serverError();
  }
}
