import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createAdminSession, createUserAdminSession } from '@/lib/auth/admin';
import { successResponse, errors } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email } = body;
    
    // Accept both 'username' (backward compatibility) and 'email' (new auth)
    const emailOrUsername = email || username;

    if (!emailOrUsername || !password) {
      return errors.badRequest('Missing email/username or password');
    }

    // Verify credentials using unified authentication
    const authResult = await verifyCredentials(emailOrUsername, password);
    
    if (!authResult.success) {
      return errors.unauthorized();
    }

    let sessionToken: string;
    let responseData: any;

    if (authResult.type === 'database') {
      // Database-based authentication
      sessionToken = createUserAdminSession(authResult.user.email, authResult.user.id);
      responseData = {
        success: true,
        email: authResult.user.email,
        name: authResult.user.name,
        type: 'database',
        organizations: authResult.user.organizations
      };
    } else {
      // Environment-based authentication (backward compatibility)
      sessionToken = createAdminSession(emailOrUsername);
      responseData = {
        success: true,
        username: emailOrUsername,
        type: 'env'
      };
    }

    // Create response with session cookie
    const response = successResponse(responseData);

    // Set HttpOnly cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in admin login:', error);
    return errors.serverError();
  }
}

export async function DELETE(request: NextRequest) {
  // Logout - clear session cookie
  const response = successResponse({ success: true });
  
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
