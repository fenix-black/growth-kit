import crypto from 'crypto';

/**
 * Generate a server-side fingerprint based on client IP, request headers, and browser context
 * This fingerprint is domain-independent and helps match users across different apps
 * 
 * Components:
 * - Client IP address (primary identifier)
 * - User-Agent (browser + OS)
 * - Accept-Language (user's language preferences)
 * - Accept-Encoding (compression support)
 * - Screen resolution (distinctive - helps distinguish multiple users on same IP)
 * - Viewport size (window size preferences)
 * - Browser type (parsed)
 * - OS type (parsed)
 * - Device type (desktop/mobile/tablet)
 * 
 * This combination is unique enough to distinguish different people in the same household
 * even when using the same network and browser.
 * 
 * @param clientIp - Client IP address
 * @param headers - Request headers
 * @param context - Optional browser context from SDK (screen resolution, browser, OS, etc.)
 * @returns 32-character hex hash
 */
export function generateServerFingerprint(
  clientIp: string, 
  headers: Headers,
  context?: any
): string {
  const components: string[] = [];
  
  // Normalize IP (handle IPv6 ::ffff: prefix for IPv4-mapped addresses)
  const normalizedIp = clientIp.replace(/^::ffff:/, '');
  components.push(normalizedIp);
  
  // Browser identification
  components.push(headers.get('user-agent') || '');
  components.push(headers.get('accept-language') || '');
  components.push(headers.get('accept-encoding') || '');
  
  // Client-provided context for enhanced uniqueness
  if (context) {
    // Screen resolution (highly distinctive - different monitors/laptops)
    if (context.screenResolution) {
      components.push(`screen:${context.screenResolution}`);
    }
    
    // Viewport size (can help distinguish users with different window sizes)
    if (context.viewport) {
      components.push(`viewport:${context.viewport}`);
    }
    
    // Browser and OS (already in user-agent, but parsed explicitly)
    if (context.browser) {
      components.push(`browser:${context.browser}`);
    }
    if (context.os) {
      components.push(`os:${context.os}`);
    }
    
    // Device type
    if (context.device) {
      components.push(`device:${context.device}`);
    }
  }
  
  // Combine all components with pipe separator
  const combined = components.join('|');
  
  // Generate SHA-256 hash and return first 32 characters
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex')
    .substring(0, 32);
}

