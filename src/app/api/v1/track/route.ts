import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppAuth } from '@/lib/security/auth';
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
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app } = authContext;

    // Get fingerprint from header
    const fingerprint = request.headers.get('x-fingerprint');
    if (!fingerprint) {
      return corsErrors.badRequest('X-Fingerprint header is required', origin);
    }

    // Verify fingerprint exists
    const fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: app.id,
          fingerprint,
        },
      },
    });

    if (!fingerprintRecord) {
      return corsErrors.notFound(origin);
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

    // Rate limiting check
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentEventCount = await prisma.activity.count({
      where: {
        fingerprintId: fingerprintRecord.id,
        timestamp: { gte: oneMinuteAgo },
      },
    });

    const rateLimit = 100; // Default rate limit
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
      fingerprintId: fingerprintRecord.id,
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

    return withCorsHeaders(
      successResponse({
        tracked: true,
        count: events.length,
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Track error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}
