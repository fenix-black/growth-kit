import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import {
  getProductWaitlists,
  productTagExists,
  validateProductConfig,
  generateProductTag,
  type ProductWaitlistConfig,
  type AppMetadata,
} from '@/lib/types/product-waitlist';

/**
 * GET /api/v1/admin/app/:appId/products
 * Returns all product waitlist configurations for an app
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

    // Get app with metadata and waitlist counts
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get products from metadata
    const products = getProductWaitlists(app.metadata);

    // Get waitlist counts for each product
    const productsWithCounts = await Promise.all(
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

        return {
          ...product,
          _count: {
            total: byStatus.WAITING + byStatus.INVITED + byStatus.ACCEPTED,
            waiting: byStatus.WAITING,
            invited: byStatus.INVITED,
            accepted: byStatus.ACCEPTED,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithCounts,
      },
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/app/:appId/products
 * Creates a new product waitlist configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: appId } = await params;
    const body = await request.json();

    // Generate tag if not provided
    if (!body.tag && body.name) {
      body.tag = generateProductTag(body.name);
    }

    // Validate product config
    const validation = validateProductConfig(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Get app
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true, metadata: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Check if tag already exists
    if (productTagExists(app.metadata, body.tag)) {
      return NextResponse.json(
        { error: 'A product with this tag already exists' },
        { status: 400 }
      );
    }

    // Create new product config
    const newProduct: ProductWaitlistConfig = {
      tag: body.tag,
      name: body.name,
      description: body.description || '',
      successMessage: body.successMessage || '',
      enabled: body.enabled !== undefined ? body.enabled : true,
      autoInviteEnabled: body.autoInviteEnabled || false,
      dailyInviteQuota: body.dailyInviteQuota || 5,
      inviteTime: body.inviteTime || '10:00',
      inviteEmailTemplate: body.inviteEmailTemplate || '',
      primaryColor: body.primaryColor || null,
      logoUrl: body.logoUrl || null,
      customFields: [], // Phase 2
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get existing products
    const existingProducts = getProductWaitlists(app.metadata);
    
    // Add new product
    const updatedMetadata: AppMetadata = {
      ...(app.metadata as any),
      productWaitlists: [...existingProducts, newProduct],
    };

    // Update app metadata
    await prisma.app.update({
      where: { id: appId },
      data: { metadata: updatedMetadata as any },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        action: 'product_waitlist.created',
        targetType: 'app',
        targetId: appId,
        metadata: {
          productTag: newProduct.tag,
          productName: newProduct.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { product: newProduct },
    });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

