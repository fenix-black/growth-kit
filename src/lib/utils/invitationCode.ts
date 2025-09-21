import { customAlphabet } from 'nanoid';

// Create a custom nanoid generator with alphanumeric characters (no ambiguous characters)
// Excludes: 0, O, I, l to avoid confusion
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

/**
 * Generate a unique invitation code
 * Format: INV-XXXXXX where X is alphanumeric
 * @returns A unique invitation code
 */
export function generateInvitationCode(): string {
  return `INV-${nanoid()}`;
}

/**
 * Validate if a string is a valid invitation code format
 * @param code The code to validate
 * @returns true if valid invitation code format
 */
export function isInvitationCode(code: string): boolean {
  // Check if it matches the pattern INV-XXXXXX
  const pattern = /^INV-[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
  return pattern.test(code);
}

/**
 * Calculate expiration date for an invitation code
 * @param days Number of days until expiration (default: 7)
 * @returns Date when the code expires
 */
export function calculateCodeExpiration(days: number = 7): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

/**
 * Check if an invitation code has expired
 * @param expiresAt The expiration date
 * @returns true if the code has expired
 */
export function isCodeExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false; // No expiration set
  return new Date() > new Date(expiresAt);
}

/**
 * Format an invitation code for display (e.g., in emails)
 * @param code The invitation code
 * @returns Formatted code
 */
export function formatInvitationCode(code: string): string {
  // Could add styling or spacing if needed
  return code;
}

/**
 * Generate a secure random string for temporary tokens
 * Used for verification tokens, not invitation codes
 * @param length The length of the token
 * @returns A random alphanumeric string
 */
export function generateSecureToken(length: number = 32): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const generator = customAlphabet(alphabet, length);
  return generator();
}
