import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { MessageRouter } from '@/lib/chat/message-router';

export async function POST(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationId } = body;

  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }

  await MessageRouter.releaseToAI(conversationId);

  return NextResponse.json({ 
    success: true,
    message: 'Conversation released to AI successfully'
  });
}

