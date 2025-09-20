import crypto from 'crypto';

const REF_SECRET = process.env.REF_SECRET!;
if (!REF_SECRET) {
  throw new Error('REF_SECRET environment variable is required');
}

interface ClaimPayload {
  referralCode: string;
  fingerprintId?: string;
  expiresAt: number;
}

/**
 * Mint a new HMAC claim token for a referral
 * @param referralCode - The referral code to claim
 * @param fingerprintId - Optional fingerprint ID to bind the claim to
 * @param ttlMinutes - Time to live in minutes (default: 30)
 */
export function mintClaim(
  referralCode: string, 
  fingerprintId?: string,
  ttlMinutes: number = 30
): string {
  const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
  const payload: ClaimPayload = {
    referralCode,
    fingerprintId,
    expiresAt,
  };

  const message = JSON.stringify(payload);
  const hmac = crypto
    .createHmac('sha256', REF_SECRET)
    .update(message)
    .digest('hex');

  // Combine payload and signature
  const token = `${Buffer.from(message).toString('base64url')}.${hmac}`;
  return token;
}

/**
 * Verify and decode an HMAC claim token
 * @param token - The token to verify
 * @returns The payload if valid and not expired, null otherwise
 */
export function verifyClaim(token: string): ClaimPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const message = Buffer.from(payloadBase64, 'base64url').toString();
    
    // Verify HMAC signature
    const expectedHmac = crypto
      .createHmac('sha256', REF_SECRET)
      .update(message)
      .digest('hex');

    // Timing-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHmac)
    )) {
      return null;
    }

    const payload: ClaimPayload = JSON.parse(message);

    // Check expiration
    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  // Generate a readable code (e.g., "GROWTH-ABC123")
  const prefix = 'GROWTH';
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Generate a verification token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
