import { prisma } from '@/lib/db';
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

  // Find active API keys with this hint
  const apiKeys = await prisma.apiKey.findMany({
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
  });

  // Try to verify against each potential match
  for (const apiKey of apiKeys) {
    if (await verifyApiKey(key, apiKey.hashedKey)) {
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      });

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
