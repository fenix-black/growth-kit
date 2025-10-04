import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';

// POST /api/admin/invitations/validate - Validate invitation token (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return errors.badRequest('Token is required');
    }

    // Find invitation by token
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { inviteToken: token },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!invitation) {
      return successResponse({ valid: false, error: 'Invalid invitation token' });
    }

    // Check if invitation is pending
    if (invitation.status !== 'PENDING') {
      return successResponse({ valid: false, error: 'This invitation has already been used or revoked' });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return successResponse({ valid: false, error: 'This invitation has expired' });
    }

    return successResponse({
      valid: true,
      email: invitation.email,
      organizationName: invitation.organization.name,
      organizationId: invitation.organization.id
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return errors.serverError();
  }
}

