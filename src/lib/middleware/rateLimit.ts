import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters with different configurations
export const rateLimits = {
  // General API rate limit: 100 requests per minute per IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Strict rate limit for sensitive operations: 10 per minute
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:sensitive',
  }),

  // Per-fingerprint rate limit: 500 requests per hour
  fingerprint: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, '1 h'),
    analytics: true,
    prefix: 'ratelimit:fingerprint',
  }),
};

/**
 * Check rate limit and return response if limited
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; response?: NextResponse }> {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    const response = NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please slow down and try again later',
      },
      { status: 429 }
    );
    
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
    
    return { success: false, response };
  }

  return { success: true };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Fallback to a default
  return '127.0.0.1';
}
