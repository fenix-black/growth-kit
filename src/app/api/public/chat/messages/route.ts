import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { corsErrors } from '@/lib/utils/corsResponse';
import { corsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication (JWT from SDK)
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    const body = await request.json();
    const { sessionId, since } = body;

    if (!sessionId) {
      return corsErrors.badRequest('Missing sessionId', origin);
    }

    // Get conversation and update lastActiveAt (indicates user is actively viewing chat)
    const conversation = await prisma.chatConversation.findUnique({
      where: { sessionId },
      select: { id: true, status: true }
    });

    if (!conversation) {
      return NextResponse.json(
        { messages: [], status: 'not_found' },
        { headers: corsHeaders(origin, authContext?.app.corsOrigins || []) }
      );
    }

    // Update lastActiveAt to mark conversation as active (user has chat open)
    await prisma.chatConversation.update({
      where: { sessionId },
      data: { lastActiveAt: new Date() }
    });

    // Get messages since timestamp
    const sinceDate = since ? new Date(since) : new Date(0);
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversation.id,
        createdAt: { gt: sinceDate }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        creditsUsed: true
      }
    });

    return NextResponse.json(
      {
        messages,
        status: conversation.status,
        conversationId: conversation.id
      },
      { headers: corsHeaders(origin, authContext.app.corsOrigins) }
    );

  } catch (error) {
    console.error('Chat messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin, []) }
    );
  }
}

