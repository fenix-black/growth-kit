/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Check if a fingerprint is valid
 */
export function isValidFingerprint(fingerprint: string): boolean {
  // Fingerprint should be a non-empty string, typically a hash
  return typeof fingerprint === 'string' && 
         fingerprint.length > 0 && 
         fingerprint.length <= 256;
}

/**
 * Parse and validate JSON safely
 */
export function safeJsonParse<T = any>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  // Format: GROWTH-XXXXXX (6 hex chars)
  const codeRegex = /^GROWTH-[A-F0-9]{6}$/i;
  return codeRegex.test(code);
}

/**
 * Generate a session ID for activity tracking
 */
export function generateSessionId(): string {
  // Simple session ID based on timestamp and random value
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
