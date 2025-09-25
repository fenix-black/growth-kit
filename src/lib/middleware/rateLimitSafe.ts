import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter as fallback
class InMemoryRateLimit {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.maxRequests = limit;
    this.windowMs = windowMs;
  }

  async limit(identifier: string) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + this.windowMs)
      };
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, times] of this.requests.entries()) {
        if (times.every(t => now - t > this.windowMs)) {
          this.requests.delete(key);
        }
      }
    }
    
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      reset: new Date(now + this.windowMs)
    };
  }
}

// Lazy Redis initialization - only create when needed at runtime
let redis: Redis | null = null;
let redisInitialized = false;
let useInMemory = false;

async function initializeRedis() {
  if (redisInitialized) return;
  redisInitialized = true;
  
  // Skip Redis during build/static generation
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development' && !process.env.UPSTASH_REDIS_REST_URL) {
    useInMemory = true;
    return;
  }
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      // Test the connection with timeout
      try {
        await Promise.race([
          redis.ping(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
          )
        ]);
      } catch (pingError) {
        console.warn('Upstash Redis ping failed, falling back to in-memory rate limiting');
        redis = null;
        useInMemory = true;
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.warn('Upstash Redis credentials not found, using in-memory rate limiting');
      }
      useInMemory = true;
    }
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis, using in-memory rate limiting:', error);
    useInMemory = true;
  }
}

// In-memory fallbacks
const inMemoryLimiters = {
  api: new InMemoryRateLimit(100, 60000), // 100 per minute
  sensitive: new InMemoryRateLimit(10, 60000), // 10 per minute
  fingerprint: new InMemoryRateLimit(500, 3600000), // 500 per hour
};

// Create rate limiters with lazy initialization
async function createRateLimiter(type: 'api' | 'sensitive' | 'fingerprint') {
  await initializeRedis();
  
  if (redis && !useInMemory) {
    const configs = {
      api: { limit: 100, window: '1 m' as const },
      sensitive: { limit: 10, window: '1 m' as const },
      fingerprint: { limit: 500, window: '1 h' as const }
    };
    
    const config = configs[type];
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      analytics: true,
      prefix: `ratelimit:${type}`,
    });
  }
  
  return inMemoryLimiters[type];
}

// Export rate limiters - these will be lazily initialized
export const rateLimits = {
  api: inMemoryLimiters.api, // Default fallback
  sensitive: inMemoryLimiters.sensitive, // Default fallback
  fingerprint: inMemoryLimiters.fingerprint, // Default fallback
};

/**
 * Check rate limit and return response if limited
 */
export async function checkRateLimit(
  identifier: string,
  limitType: 'api' | 'sensitive' | 'fingerprint'
): Promise<{ success: boolean; response?: NextResponse }> {
  try {
    // Get the appropriate rate limiter
    const limiter = await createRateLimiter(limitType);
    const { success, limit: rateLimit, reset, remaining } = await limiter.limit(identifier);
    
    if (!success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset instanceof Date ? reset.toISOString() : new Date(reset).toISOString(),
              'Retry-After': Math.ceil(((reset instanceof Date ? reset.getTime() : reset) - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }
    
    return { success: true };
  } catch (error) {
    // If rate limiting fails, log but don't block the request
    console.error('Rate limit check failed:', error);
    
    // In production, you might want to be more cautious
    // For now, allow the request to proceed
    return { success: true };
  }
}

/**
 * Legacy function for backwards compatibility with existing rate limiter objects
 */
export async function checkRateLimitLegacy(
  identifier: string,
  limiter: Ratelimit | InMemoryRateLimit
): Promise<{ success: boolean; response?: NextResponse }> {
  try {
    const { success, limit: rateLimit, reset, remaining } = await limiter.limit(identifier);
    
    if (!success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset instanceof Date ? reset.toISOString() : new Date(reset).toISOString(),
              'Retry-After': Math.ceil(((reset instanceof Date ? reset.getTime() : reset) - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }
    
    return { success: true };
  } catch (error) {
    // If rate limiting fails, log but don't block the request
    console.error('Rate limit check failed:', error);
    
    // In production, you might want to be more cautious
    // For now, allow the request to proceed
    return { success: true };
  }
}

/**
 * Get client IP from headers
 */
export function getClientIp(headers: Headers): string {
  // Check various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback to a default
  return '127.0.0.1';
}
