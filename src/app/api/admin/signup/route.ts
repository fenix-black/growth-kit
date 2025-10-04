import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, organizationName, inviteToken } = body;

    // Validate required fields (organizationName not required if inviteToken is provided)
    if (!name || !email || !password) {
      return errors.badRequest('Missing required fields');
    }

    if (!inviteToken && !organizationName) {
      return errors.badRequest('Organization name is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errors.badRequest('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      return errors.badRequest('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return errors.badRequest('User with this email already exists');
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Handle invitation flow or regular signup
    let result;

    if (inviteToken) {
      // Invitation-based signup
      const invitation = await prisma.organizationInvitation.findUnique({
        where: { inviteToken },
        include: {
          organization: true
        }
      });

      if (!invitation) {
        return errors.badRequest('Invalid invitation token');
      }

      if (invitation.status !== 'PENDING') {
        return errors.badRequest('This invitation has already been used or revoked');
      }

      if (new Date() > invitation.expiresAt) {
        await prisma.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' }
        });
        return errors.badRequest('This invitation has expired');
      }

      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return errors.badRequest('Email does not match invitation');
      }

      // Create user and add to organization in transaction
      result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            organizations: {
              connect: { id: invitation.organizationId }
            }
          },
          include: {
            organizations: true
          }
        });

        // Mark invitation as accepted
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' }
        });

        return { user, organization: invitation.organization };
      });

      console.log(`✅ User ${email} accepted invitation and joined ${result.organization.name}`);

    } else {
      // Regular signup - create new organization
      result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName
          }
        });

        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            organizations: {
              connect: { id: organization.id }
            }
          },
          include: {
            organizations: true
          }
        });

        return { user, organization };
      });

      console.log(`✅ User ${email} signed up and created organization ${organizationName}`);
    }

    return successResponse({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organizations: result.user.organizations
      }
    });

  } catch (error) {
    console.error('Error in admin signup:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return errors.badRequest('User with this email already exists');
      }
    }
    
    return errors.serverError();
  }
}
