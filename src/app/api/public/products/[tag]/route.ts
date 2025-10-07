import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import { findProductByTag } from '@/lib/types/product-waitlist';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

/**
 * GET /api/public/products/:tag
 * Returns details about a specific product waitlist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app, fingerprint } = authContext;

    // Verify origin is allowed for this app (includes default origins)
    if (origin && !isOriginAllowed(origin, app.corsOrigins)) {
      return corsErrors.forbidden(origin);
    }

    const { tag } = await params;

    // Get app metadata
    const appData = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        metadata: true,
        primaryColor: true,
        logoUrl: true,
      },
    });

    // Find product configuration
    const product = findProductByTag(appData?.metadata, tag);
    
    if (!product) {
      return withCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        ),
        origin,
        app.corsOrigins
      );
    }

    if (!product.enabled) {
      return withCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Product waitlist is not currently accepting signups' },
          { status: 404 }
        ),
        origin,
        app.corsOrigins
      );
    }

    // Get pre-filled values from fingerprint/lead if exists
    const lead = await prisma.lead.findFirst({
      where: { fingerprintId: fingerprint.id },
      select: {
        name: true,
        email: true,
      },
    });

    const prefilledFields: Record<string, any> = {};
    if (lead?.name) {
      prefilledFields.name = lead.name;
    }
    if (lead?.email) {
      prefilledFields.email = lead.email;
    }

    // Build response
    const productData = {
      tag: product.tag,
      name: product.name,
      description: product.description,
      successMessage: product.successMessage,
      primaryColor: product.primaryColor || appData?.primaryColor || undefined,
      logoUrl: product.logoUrl || appData?.logoUrl || undefined,
      customFields: product.customFields || [], // Phase 2
      prefilledFields,
    };

    return withCorsHeaders(
      successResponse(productData),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public product details error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}

