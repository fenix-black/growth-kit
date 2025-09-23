import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple CORS handler for OPTIONS requests
 * This is used when we can't determine the app from the request (no auth in preflight)
 */
export function handleSimpleOptions(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (!origin) {
    return new NextResponse(null, { status: 204 });
  }
  
  // Check environment variable first
  const envOrigins = process.env.CORS_ALLOWLIST?.split(',').map(s => s.trim()) || [];
  if (envOrigins.includes(origin) || envOrigins.includes('*')) {
    return corsResponse(origin);
  }
  
  try {
    const url = new URL(origin);
    
    // Allow all fenixblack.ai subdomains
    if (url.hostname.endsWith('fenixblack.ai') || url.hostname === 'fenixblack.ai') {
      return corsResponse(origin);
    }
    
    // Allow development origins
    if (url.hostname === 'localhost' || 
        url.hostname === '127.0.0.1' ||
        url.hostname.startsWith('192.168.') ||
        url.hostname.startsWith('10.') ||
        url.hostname.startsWith('172.')) {
      return corsResponse(origin);
    }
  } catch {
    // Invalid URL, deny
  }
  
  // No valid origin, return without CORS headers
  return new NextResponse(null, { status: 204 });
}

function corsResponse(origin: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Fingerprint',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}
