import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      fingerprint: {
        select: {
          browser: true,
          device: true,
          location: true
        }
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
          metadata: true,
          creditsUsed: true
        }
      }
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ 
    conversation,
    messages: conversation.messages
  });
}

