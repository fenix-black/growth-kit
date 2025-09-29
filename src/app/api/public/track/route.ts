import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { generateSessionId } from '@/lib/utils/validation';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app, fingerprint } = authContext;

    // Verify origin is allowed for this app
    if (origin && app.corsOrigins.length > 0 && !app.corsOrigins.includes(origin)) {
      return corsErrors.forbidden(origin);
    }

    // Parse request body
    const contentType = request.headers.get('content-type');
    let body;
    
    // Handle sendBeacon data (comes as blob)
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      // Try to parse as text then JSON
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return corsErrors.badRequest('Request body must be valid JSON', origin);
      }
    }

    const { events, context: clientContext, sessionId: clientSessionId } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return corsErrors.badRequest('Events must be a non-empty array', origin);
    }

    // Rate limiting check - more restrictive for public API
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentEventCount = await prisma.activity.count({
      where: {
        fingerprintId: fingerprint.id,
        timestamp: { gte: oneMinuteAgo },
      },
    });

    const rateLimit = 50; // Lower rate limit for public API
    if (recentEventCount + events.length > rateLimit) {
      return corsErrors.badRequest(`Rate limit exceeded: Maximum ${rateLimit} events per minute`, origin);
    }

    // Use client context if provided, otherwise create default
    const context = clientContext || {
      browser: 'unknown',
      os: 'unknown', 
      device: 'unknown',
      screenResolution: '0x0',
      viewport: '0x0',
      url: '',
      referrer: '',
      userAgent: request.headers.get('user-agent') || '',
    };

    // Use client session ID if provided, otherwise generate new one
    const sessionId = clientSessionId || generateSessionId();

    // Create activity records
    const activities = events.map((event: any) => ({
      appId: app.id,
      fingerprintId: fingerprint.id,
      eventName: event.eventName,
      properties: event.properties || null,
      context,
      sessionId,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));

    // Batch insert
    await prisma.activity.createMany({
      data: activities,
    });

    // Update fingerprint last active timestamp
    await prisma.fingerprint.update({
      where: { id: fingerprint.id },
      data: { lastActiveAt: new Date() },
    });

    return withCorsHeaders(
      successResponse({
        tracked: true,
        count: events.length,
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Public track error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
