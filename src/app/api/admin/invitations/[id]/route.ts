import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { verifyAdminSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { generateVerificationToken } from '@/lib/security/hmac';
import { sendTeamInvitationEmail } from '@/lib/email/send';

// DELETE /api/admin/invitations/[id] - Revoke invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    const session = verifyAdminSession(sessionCookie.value);
    if (!session || !session.email || !session.userId) {
      return errors.unauthorized();
    }

    // Get invitation
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            users: {
              where: { id: session.userId }
            }
          }
        }
      }
    });

    if (!invitation) {
      return errors.notFound();
    }

    // Verify user belongs to the organization
    if (invitation.organization.users.length === 0) {
      return errors.forbidden();
    }

    // Revoke invitation
    await prisma.organizationInvitation.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    return successResponse({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return errors.serverError();
  }
}

// POST /api/admin/invitations/[id]/resend - Resend invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    const session = verifyAdminSession(sessionCookie.value);
    if (!session || !session.email || !session.userId) {
      return errors.unauthorized();
    }

    // Get invitation
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            users: {
              where: { id: session.userId }
            }
          }
        },
        inviter: {
          select: { name: true }
        }
      }
    });

    if (!invitation) {
      return errors.notFound();
    }

    // Verify user belongs to the organization
    if (invitation.organization.users.length === 0) {
      return errors.forbidden();
    }

    // Can only resend pending invitations
    if (invitation.status !== 'PENDING') {
      return errors.badRequest('Can only resend pending invitations');
    }

    // Generate new token and extend expiry
    const inviteToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update invitation
    const updatedInvitation = await prisma.organizationInvitation.update({
      where: { id },
      data: {
        inviteToken,
        expiresAt,
        updatedAt: new Date()
      }
    });

    // Resend email
    try {
      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://growth.fenixblack.ai'}/admin/signup?invite=${inviteToken}`;
      
      await sendTeamInvitationEmail({
        to: invitation.email,
        organizationName: invitation.organization.name,
        inviterName: invitation.inviter.name,
        inviteLink,
        expiresAt
      });
      
      console.log(`✅ Team invitation resent to ${invitation.email}`);
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
      // Don't fail the request if email fails
    }

    return successResponse({ 
      invitation: updatedInvitation,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return errors.serverError();
  }
}

