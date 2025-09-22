import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { errors } from '@/lib/utils/response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in as admin
    const isAuthenticated = await isAdminAuthenticated();
    
    if (!isAuthenticated) {
      return errors.unauthorized();
    }
    
    // Instead of making an internal HTTP request, directly query the database
    const apps = await prisma.app.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        dailyInviteQuota: true,
        autoInviteEnabled: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { apps }
    });
  } catch (error) {
    console.error('Error in proxy/apps:', error);
    return errors.serverError();
  }
}
