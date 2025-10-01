import { prisma } from '@/lib/db';
import { withRetry } from '@/lib/db-helpers';
import { extractApiKey, verifyApiKey } from './apiKeys';
import { App, ApiKey } from '@prisma/client';

export interface AuthContext {
  app: App;
  apiKey: ApiKey;
}

/**
 * Verify app authentication via API key
 * @param headers - Request headers
 * @returns Auth context if valid, null otherwise
 */
export async function verifyAppAuth(headers: Headers): Promise<AuthContext | null> {
  const key = extractApiKey(headers);
  if (!key) return null;

  // Extract key hint (first 8 chars)
  const hint = key.substring(0, 8);

  // Find active API keys with this hint (with retry for connection pool timeouts)
  const apiKeys = await withRetry(() => 
    prisma.apiKey.findMany({
      where: {
        keyHint: hint,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        app: true
      }
    })
  );

  // Try to verify against each potential match
  for (const apiKey of apiKeys) {
    if (await verifyApiKey(key, apiKey.hashedKey)) {
      // Update last used timestamp (with retry for connection pool timeouts)
      await withRetry(() => 
        prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() }
        })
      );

      // Check if app is active
      if (!apiKey.app.isActive) {
        return null;
      }

      return {
        app: apiKey.app,
        apiKey
      };
    }
  }

  return null;
}

/**
 * Verify service key for admin endpoints
 */
export function verifyServiceKey(headers: Headers): boolean {
  const authHeader = headers.get('authorization');
  if (!authHeader) return false;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return false;
  }

  const key = parts[1];
  return key === process.env.SERVICE_KEY;
}

export interface PublicAuthContext {
  app: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    waitlistLayout: string | null;
    hideGrowthKitBranding: boolean | null;
    corsOrigins: string[];
    isActive: boolean;
  };
  fingerprint: {
    id: string;
    fingerprint: string;
    appId: string;
  };
  token: {
    appId: string;
    fingerprintId: string;
    fingerprint: string;
    type: string;
  };
}

/**
 * Extract and verify public token from request headers
 */
export async function verifyPublicToken(headers: Headers): Promise<PublicAuthContext | null> {
  const authHeader = headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];
  
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (decoded.type !== 'public') {
      return null;
    }

    // Get the app and fingerprint data
    const app = await withRetry(() =>
      prisma.app.findUnique({
        where: { id: decoded.appId },
        select: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
          primaryColor: true,
          waitlistLayout: true,
          hideGrowthKitBranding: true,
          corsOrigins: true,
          isActive: true,
        },
      })
    );

    if (!app || !app.isActive) {
      return null;
    }

    const fingerprint = await withRetry(() =>
      prisma.fingerprint.findUnique({
        where: { id: decoded.fingerprintId },
        select: {
          id: true,
          fingerprint: true,
          appId: true,
        },
      })
    );

    if (!fingerprint) {
      return null;
    }

    return {
      app,
      fingerprint,
      token: decoded,
    };
  } catch (error) {
    return null;
  }
}
