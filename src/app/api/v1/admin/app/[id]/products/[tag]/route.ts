import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import {
  getProductWaitlists,
  findProductByTag,
  productTagExists,
  validateProductConfig,
  type AppMetadata,
} from '@/lib/types/product-waitlist';

/**
 * GET /api/v1/admin/app/:appId/products/:tag
 * Returns a single product waitlist configuration with analytics
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

    // Get app with metadata
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { metadata: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Find product
    const product = findProductByTag(app.metadata, tag);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get waitlist counts
    const counts = await prisma.waitlist.groupBy({
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

    counts.forEach((c: any) => {
      byStatus[c.status as keyof typeof byStatus] = c._count;
    });

    const total = byStatus.WAITING + byStatus.INVITED + byStatus.ACCEPTED;

    return NextResponse.json({
      success: true,
      data: {
        product,
        analytics: {
          total,
          byStatus,
        },
      },
    });

  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/app/:appId/products/:tag
 * Updates a product waitlist configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tag: string }> }
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: appId, tag } = await params;
    const updates = await request.json();

    // Don't allow tag changes
    if (updates.tag && updates.tag !== tag) {
      return NextResponse.json(
        { error: 'Cannot change product tag (breaking change)' },
        { status: 400 }
      );
    }

    // Get app
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { metadata: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get existing products
    const products = getProductWaitlists(app.metadata);
    const productIndex = products.findIndex(p => p.tag === tag);

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product
    const updatedProduct = {
      ...products[productIndex],
      ...updates,
      tag, // Keep original tag
      updatedAt: new Date().toISOString(),
    };

    // Validate updated config
    const validation = validateProductConfig(updatedProduct);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update products array
    products[productIndex] = updatedProduct;

    // Update app metadata
    const updatedMetadata: AppMetadata = {
      ...(app.metadata as any),
      productWaitlists: products,
    };

    await prisma.app.update({
      where: { id: appId },
      data: { metadata: updatedMetadata as any },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        action: 'product_waitlist.updated',
        targetType: 'app',
        targetId: appId,
        metadata: {
          productTag: tag,
          updates: Object.keys(updates),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { product: updatedProduct },
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/app/:appId/products/:tag
 * Soft deletes a product (sets enabled: false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tag: string }> }
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: appId, tag } = await params;

    // Get app
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { metadata: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get existing products
    const products = getProductWaitlists(app.metadata);
    const productIndex = products.findIndex(p => p.tag === tag);

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete (set enabled: false)
    products[productIndex].enabled = false;
    products[productIndex].updatedAt = new Date().toISOString();

    // Update app metadata
    const updatedMetadata: AppMetadata = {
      ...(app.metadata as any),
      productWaitlists: products,
    };

    await prisma.app.update({
      where: { id: appId },
      data: { metadata: updatedMetadata as any },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        action: 'product_waitlist.deleted',
        targetType: 'app',
        targetId: appId,
        metadata: {
          productTag: tag,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product disabled successfully',
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

