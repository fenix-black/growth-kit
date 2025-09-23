import { NextRequest } from 'next/server';
import { verifyAppAuth } from '@/lib/security/auth';
import { handleCorsPreflightResponse } from './cors';

/**
 * Handle OPTIONS preflight requests with proper CORS headers
 * Since browsers don't send Authorization headers in preflight,
 * we need a fallback strategy for development origins
 */
export async function handleOptionsRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Try to get app context to use its CORS origins
  // Note: This will likely fail for preflight since browsers don't send Authorization
  const authContext = await verifyAppAuth(request.headers);
  
  // Use app's CORS origins if available, otherwise fall back to env variable
  let corsOrigins = authContext?.app.corsOrigins || 
    process.env.CORS_ALLOWLIST?.split(',') || [];
    
  // If no origins configured and this looks like a development origin, allow it
  // This helps during development when auth headers aren't available in preflight
  if (corsOrigins.length === 0 && origin) {
    // Allow common development origins
    const isDevelopmentOrigin = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      origin.includes('0.0.0.0') ||
      origin.startsWith('http://192.168.'); // Local network IPs
      
    if (isDevelopmentOrigin) {
      corsOrigins = [origin];
    }
  }
    
  return handleCorsPreflightResponse(origin, corsOrigins);
}
