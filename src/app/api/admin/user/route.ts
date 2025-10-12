import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { verifyAdminSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

// GET /api/admin/user - Get current user with organizations
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    const session = verifyAdminSession(sessionCookie.value);
    if (!session || !session.email || !session.userId) {
      return errors.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organizations: {
          include: {
            users: true,
            _count: true
          }
        }
      }
    });

    if (!user) {
      return errors.unauthorized();
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      organizations: user.organizations,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return errors.serverError();
  }
}

