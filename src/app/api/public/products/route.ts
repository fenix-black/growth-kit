import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { getProductWaitlists, type PublicProductResponse } from '@/lib/types/product-waitlist';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

/**
 * GET /api/public/products
 * Returns list of enabled product waitlists for the authenticated app
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app } = authContext;

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    // Get app metadata
    const appData = await prisma.app.findUnique({
      where: { id: app.id },
      select: {
        metadata: true,
        primaryColor: true,
        logoUrl: true,
      },
    });

    // Get products from metadata
    const products = getProductWaitlists(appData?.metadata);
    
    // Filter enabled products and format for public API
    const enabledProducts: PublicProductResponse[] = products
      .filter(p => p.enabled)
      .map(p => ({
        tag: p.tag,
        name: p.name,
        description: p.description,
        primaryColor: p.primaryColor || appData?.primaryColor || undefined,
        logoUrl: p.logoUrl || appData?.logoUrl || undefined,
        enabled: p.enabled,
      }));

    // Cache for 5 minutes
    const response = withCorsHeaders(
      successResponse({ products: enabledProducts }),
      origin,
      app.corsOrigins
    );

    response.headers.set('Cache-Control', 'public, max-age=300');

    return response;

  } catch (error) {
    console.error('Public products list error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}

