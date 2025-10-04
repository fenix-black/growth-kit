import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { verifyAdminSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { generateVerificationToken } from '@/lib/security/hmac';
import { isValidEmail } from '@/lib/utils/validation';
import { sendTeamInvitationEmail } from '@/lib/email/send';

// GET /api/admin/invitations - List invitations for current user's organizations
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

    // Get user's organizations
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organizations: {
          include: {
            invitations: {
              where: {
                status: { in: ['PENDING', 'ACCEPTED'] }
              },
              include: {
                inviter: {
                  select: { name: true, email: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user) {
      return errors.unauthorized();
    }

    // Flatten invitations from all organizations
    const invitations = user.organizations.flatMap(org => 
      org.invitations.map(inv => ({
        ...inv,
        organizationName: org.name,
        organizationId: org.id
      }))
    );

    return successResponse({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return errors.serverError();
  }
}

// POST /api/admin/invitations - Send new invitation
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email, organizationId } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return errors.badRequest('Invalid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate organization
    if (!organizationId) {
      return errors.badRequest('Organization ID is required');
    }

    // Verify user belongs to this organization
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organizations: {
          where: { id: organizationId }
        }
      }
    });

    if (!user || user.organizations.length === 0) {
      return errors.forbidden();
    }

    const organization = user.organizations[0];

    // Check if email already belongs to a user in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        organizations: {
          some: { id: organizationId }
        }
      }
    });

    if (existingUser) {
      return errors.badRequest('User is already a member of this organization');
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId,
        email: normalizedEmail,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return errors.badRequest('An invitation is already pending for this email');
    }

    // Generate invitation token
    const inviteToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        invitedBy: session.userId,
        inviteToken,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        inviter: {
          select: { name: true, email: true }
        }
      }
    });

    // Send invitation email
    try {
      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://growth.fenixblack.ai'}/admin/signup?invite=${inviteToken}`;
      
      await sendTeamInvitationEmail({
        to: normalizedEmail,
        organizationName: organization.name,
        inviterName: user.name,
        inviteLink,
        expiresAt
      });
      
      console.log(`✅ Team invitation sent to ${normalizedEmail} for ${organization.name}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails - invitation is created
    }

    return successResponse({ 
      invitation: {
        ...invitation,
        organizationName: organization.name
      },
      message: 'Invitation sent successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating invitation:', error);
    return errors.serverError();
  }
}

