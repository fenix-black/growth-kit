import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.REF_SECRET || 'default-secret';

export interface AdminSession {
  username: string;
  expiresAt: number;
}

/**
 * Create admin session token
 */
export function createAdminSession(username: string): string {
  const session: AdminSession = {
    username,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  const payload = JSON.stringify(session);
  const hmac = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');

  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

/**
 * Verify admin session token
 */
export function verifyAdminSession(token: string): AdminSession | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const payload = Buffer.from(payloadBase64, 'base64url').toString();
    
    // Verify HMAC signature
    const expectedHmac = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedHmac) return null;

    const session: AdminSession = JSON.parse(payload);

    // Check expiration
    if (session.expiresAt < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    console.error('Admin credentials not configured in environment');
    return false;
  }

  return username === ADMIN_USER && password === ADMIN_PASSWORD;
}

/**
 * Check if request has valid admin session
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  
  if (!sessionCookie) return false;

  const session = verifyAdminSession(sessionCookie.value);
  return session !== null;
}

/**
 * Admin auth middleware for API routes
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const sessionCookie = request.cookies.get('admin_session');
  
  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const session = verifyAdminSession(sessionCookie.value);
  if (!session) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }

  return null; // Continue
}
