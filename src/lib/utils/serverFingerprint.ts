import crypto from 'crypto';

/**
 * Generate a server-side fingerprint based on client IP and request headers
 * This fingerprint is domain-independent and helps match users across different apps
 * 
 * Components:
 * - Client IP address (primary identifier)
 * - User-Agent (browser + OS)
 * - Accept-Language (user's language preferences)
 * 
 * @param clientIp - Client IP address
 * @param headers - Request headers
 * @returns 32-character hex hash
 */
export function generateServerFingerprint(clientIp: string, headers: Headers): string {
  const userAgent = headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language') || '';
  
  // Normalize IP (handle IPv6 ::ffff: prefix for IPv4-mapped addresses)
  const normalizedIp = clientIp.replace(/^::ffff:/, '');
  
  // Combine components with pipe separator
  const combined = `${normalizedIp}|${userAgent}|${acceptLanguage}`;
  
  // Generate SHA-256 hash and return first 32 characters (64 hex chars total)
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex')
    .substring(0, 32);
}

