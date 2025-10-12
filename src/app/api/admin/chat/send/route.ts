import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { MessageRouter } from '@/lib/chat/message-router';

export async function POST(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationId, message } = body;

  if (!conversationId || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify conversation is in human handoff mode
  const status = await MessageRouter.getConversationStatus(conversationId);
  if (!status.isHumanHandoff) {
    return NextResponse.json(
      { error: 'Conversation is not in human handoff mode' },
      { status: 400 }
    );
  }

  // Store message
  const savedMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: 'assistant',
      content: message,
      creditsUsed: 0,
      metadata: { sentByHuman: true }
    }
  });

  return NextResponse.json({ 
    success: true,
    message: savedMessage
  });
}

