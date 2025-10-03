import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { findProductByTag } from '@/lib/types/product-waitlist';

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

    // Get appId and productTag from query params
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const productTag = searchParams.get('productTag');

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    // Build where clause
    const whereClause: any = { appId };
    
    if (productTag !== null && productTag !== undefined) {
      // Filter by specific product (including null for app-level)
      whereClause.productTag = productTag === '' ? null : productTag;
    }

    // Get product name if filtering by productTag
    let productName: string | undefined;
    if (productTag && productTag !== '') {
      const app = await prisma.app.findUnique({
        where: { id: appId },
        select: { metadata: true },
      });
      
      const product = findProductByTag(app?.metadata, productTag);
      productName = product?.name;
    }

    // Fetch waitlist entries
    const entries = await prisma.waitlist.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return successResponse({
      entries,
      productTag: productTag || null,
      productName,
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
    const { appId, email, productTag } = body;

    if (!appId || !email) {
      return errors.badRequest('appId and email are required');
    }

    // Check if already on waitlist
    const existing = await prisma.waitlist.findFirst({
      where: {
        appId,
        email,
        productTag: productTag || null,
      },
    });

    if (existing) {
      return errors.badRequest('Email already on this waitlist');
    }

    // Get the next position (only for app-level waitlists)
    let position: number | null = null;
    if (!productTag) {
      const lastInQueue = await prisma.waitlist.findFirst({
        where: {
          appId,
          status: 'WAITING',
          productTag: null,
        } as any,
        orderBy: {
          position: 'desc',
        },
        select: {
          position: true,
        },
      });

      position = (lastInQueue?.position || 0) + 1;
    }

    // Add to waitlist
    const entry = await prisma.waitlist.create({
      data: {
        appId,
        email,
        productTag: productTag || null,
        position,
        status: 'WAITING',
      } as any,
    });

    return successResponse({ entry });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return errors.serverError();
  }
}

export async function PATCH(request: NextRequest) {
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
    const { appId, entryId, metadata } = body;

    if (!appId || !entryId) {
      return errors.badRequest('appId and entryId are required');
    }

    // Update waitlist entry metadata
    const entry = await prisma.waitlist.update({
      where: {
        id: entryId,
      },
      data: {
        metadata: metadata || {},
      },
    });

    return successResponse({ entry });
  } catch (error) {
    console.error('Error updating waitlist entry:', error);
    return errors.serverError();
  }
}

export async function DELETE(request: NextRequest) {
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
    const { appId, entryId, waitlistIds } = body;

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    // Support both single and bulk deletion
    const idsToDelete = waitlistIds && Array.isArray(waitlistIds) ? waitlistIds : (entryId ? [entryId] : []);

    if (idsToDelete.length === 0) {
      return errors.badRequest('Either entryId or waitlistIds array is required');
    }

    // Verify all entries exist and belong to the app
    const entries = await prisma.waitlist.findMany({
      where: {
        id: { in: idsToDelete },
        appId,
      },
    });

    if (entries.length !== idsToDelete.length) {
      return errors.badRequest('One or more waitlist entries not found or do not belong to this app');
    }

    // Delete the entries
    const result = await prisma.waitlist.deleteMany({
      where: {
        id: { in: idsToDelete },
        appId,
      },
    });

    // Log the deletion
    await prisma.eventLog.create({
      data: {
        appId,
        event: 'admin.waitlist_deleted',
        entityType: 'waitlist',
        entityId: idsToDelete[0], // Log first ID for reference
        metadata: {
          deletedCount: result.count,
          entryIds: idsToDelete,
          emails: entries.map(e => e.email),
        },
      },
    });

    return successResponse({
      deleted: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Error deleting waitlist entries:', error);
    return errors.serverError();
  }
}
