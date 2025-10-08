import { NextResponse } from 'next/server';

/**
 * Default origins that are always allowed (development and preview environments)
 * These don't need to be configured per-app
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'localhost',           // localhost on any port
  '127.0.0.1',          // 127.0.0.1 on any port
  '*.vusercontent.net',  // Vercel v0 preview sites
  '*.vercel.app',        // Vercel deployment domains
];

/**
 * Check if an origin matches the default allowed origins
 */
function isDefaultOriginAllowed(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Check localhost or 127.0.0.1 (any port)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    
    // Check wildcard patterns (e.g., *.vusercontent.net)
    for (const pattern of DEFAULT_ALLOWED_ORIGINS) {
      if (pattern.startsWith('*.')) {
        const domain = pattern.slice(2);
        // Match if hostname ends with .domain or is exactly domain
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          return true;
        }
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if an origin is allowed based on configured origins
 */
function isConfiguredOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed === origin) return true;
    
    // Support wildcard subdomains (*.example.com)
    if (allowed.startsWith('*.')) {
      try {
        const domain = allowed.slice(2);
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;
        // Match if hostname ends with .domain or is exactly domain
        return hostname === domain || hostname.endsWith('.' + domain);
      } catch {
        return false;
      }
    }
    
    return false;
  });
}

/**
 * Check if an origin is allowed (default origins OR configured origins)
 */
export function isOriginAllowed(origin: string | null, configuredOrigins: string[]): boolean {
  if (!origin) return false;
  
  // Check default origins first
  if (isDefaultOriginAllowed(origin)) {
    return true;
  }
  
  // Check configured origins
  return isConfiguredOriginAllowed(origin, configuredOrigins);
}

/**
 * Apply CORS headers based on app configuration
 * Automatically includes default allowed origins (localhost, 127.0.0.1, *.vusercontent.net)
 */
export function corsHeaders(
  origin: string | null,
  allowedOrigins: string[]
): HeadersInit {
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Fingerprint',
    'Access-Control-Max-Age': '86400',
  };

  // Check if origin is allowed (default + configured)
  if (origin) {
    const isAllowed = isOriginAllowed(origin, allowedOrigins);

    if (isAllowed) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  } else if (allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightResponse(
  origin: string | null,
  allowedOrigins: string[]
): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin, allowedOrigins)
  });
}

/**
 * Apply CORS headers to a response
 */
export function withCorsHeaders(
  response: NextResponse,
  origin: string | null,
  allowedOrigins: string[]
): NextResponse {
  const headers = corsHeaders(origin, allowedOrigins);
  Object.entries(headers).forEach(([key, value]) => {
    if (value) response.headers.set(key, value as string);
  });
  return response;
}
