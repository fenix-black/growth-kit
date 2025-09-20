import { NextResponse } from 'next/server';

/**
 * Apply CORS headers based on app configuration
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

  // Check if origin is allowed
  if (origin && allowedOrigins.length > 0) {
    // Check exact match or wildcard
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === origin) return true;
      
      // Support wildcard subdomains (*.example.com)
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        const originUrl = new URL(origin);
        return originUrl.hostname.endsWith(domain);
      }
      
      return false;
    });

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
