import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { verifyAdminSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

// DELETE /api/admin/team/members/[id] - Remove team member from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userIdToRemove } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    const session = verifyAdminSession(sessionCookie.value);
    if (!session || !session.email || !session.userId) {
      return errors.unauthorized();
    }

    // Prevent self-removal
    if (session.userId === userIdToRemove) {
      return errors.badRequest('You cannot remove yourself from the organization');
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return errors.badRequest('Organization ID is required');
    }

    // Verify current user belongs to this organization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organizations: {
          where: { id: organizationId }
        }
      }
    });

    if (!currentUser || currentUser.organizations.length === 0) {
      return errors.forbidden();
    }

    // Verify user to remove belongs to this organization
    const userToRemove = await prisma.user.findUnique({
      where: { id: userIdToRemove },
      include: {
        organizations: {
          where: { id: organizationId }
        }
      }
    });

    if (!userToRemove || userToRemove.organizations.length === 0) {
      return errors.notFound();
    }

    // Remove user from organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        users: {
          disconnect: { id: userIdToRemove }
        }
      }
    });

    return successResponse({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return errors.serverError();
  }
}

