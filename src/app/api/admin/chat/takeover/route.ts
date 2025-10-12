import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { MessageRouter } from '@/lib/chat/message-router';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth/admin';

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

  // Get current user ID from admin session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  const session = sessionCookie ? verifyAdminSession(sessionCookie.value) : null;
  const userId = session?.userId || session?.email || 'admin';

  await MessageRouter.takeOver(conversationId, userId);

  return NextResponse.json({ 
    success: true,
    message: 'Conversation taken over successfully'
  });
}

