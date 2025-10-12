import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const status = searchParams.get('status');

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: {
      appId,
      ...(status && { status })
    },
    include: {
      fingerprint: {
        select: {
          browser: true,
          device: true,
          location: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          content: true,
          role: true,
          createdAt: true
        }
      },
      _count: {
        select: { messages: true }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  return NextResponse.json({ conversations });
}

