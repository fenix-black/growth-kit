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

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  }

  const config = await prisma.chatConfiguration.findUnique({
    where: { appId },
    include: {
      calendarConfig: {
        include: {
          meetingTypes: true
        }
      }
    }
  });

  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { appId, ...updateData } = body;

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  }

  // Upsert chat configuration
  const config = await prisma.chatConfiguration.upsert({
    where: { appId },
    create: {
      appId,
      ...updateData
    },
    update: updateData
  });

  return NextResponse.json({ config });
}

