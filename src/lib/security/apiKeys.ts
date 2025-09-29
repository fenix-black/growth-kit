import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Generate a new API key
 * Returns the raw key (to show once) and hint (first 8 chars)
 */
export function generateApiKey(): { key: string; hint: string } {
  const key = `gk_${crypto.randomBytes(32).toString('base64url')}`;
  const hint = key.substring(0, 8);
  return { key, hint };
}

/**
 * Generate a new public key for client-side usage
 * Returns a public key that's safe to expose in client code
 */
export function generatePublicKey(): string {
  return `pk_${crypto.randomBytes(16).toString('base64url')}`;
}

/**
 * Hash an API key using bcrypt
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, SALT_ROUNDS);
}

/**
 * Verify an API key against its hash using timing-safe comparison
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

/**
 * Extract the API key from request headers
 */
export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader) return null;

  // Support both "Bearer <key>" and just "<key>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  
  return authHeader;
}
