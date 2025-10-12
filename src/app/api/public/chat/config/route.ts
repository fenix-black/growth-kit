import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { corsErrors } from '@/lib/utils/corsResponse';
import { corsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication (JWT from SDK)
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    // Get chat configuration for this app
    const config = await prisma.chatConfiguration.findUnique({
      where: { appId: authContext.app.id },
      select: {
        enabled: true,
        botName: true,
        welcomeMessage: true,
        enableCalendar: true,
        enableRAG: true
      }
    });

    if (!config || !config.enabled) {
      return NextResponse.json(
        { enabled: false },
        { headers: corsHeaders(origin, authContext.app.corsOrigins) }
      );
    }

    return NextResponse.json(
      {
        enabled: true,
        botName: config.botName,
        welcomeMessage: config.welcomeMessage || 'Hi! How can I help you today?',
        enableCalendar: config.enableCalendar,
        enableRAG: config.enableRAG
      },
      { headers: corsHeaders(origin, authContext.app.corsOrigins) }
    );

  } catch (error) {
    console.error('Chat config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin, []) }
    );
  }
}

