import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSession } from '@/lib/auth/admin';
import { successResponse, errors } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errors.badRequest('Missing username or password');
    }

    // Verify credentials
    if (!verifyAdminCredentials(username, password)) {
      return errors.unauthorized();
    }

    // Create session token
    const sessionToken = createAdminSession(username);

    // Create response with session cookie
    const response = successResponse({
      success: true,
      username,
    });

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
