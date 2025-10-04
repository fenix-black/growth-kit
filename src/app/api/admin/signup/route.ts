import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, organizationName } = body;

    // Validate required fields
    if (!name || !email || !password || !organizationName) {
      return errors.badRequest('Missing required fields');
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

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName
        }
      });

      // Create user and connect to organization
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
