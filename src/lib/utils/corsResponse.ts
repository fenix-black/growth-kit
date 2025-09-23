import { NextResponse } from 'next/server';
import { errorResponse } from './response';

/**
 * Add CORS headers to any response
 */
export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (!origin) return response;
  
  try {
    const url = new URL(origin);
    
    // Allow fenixblack.ai domains and development origins
    const isAllowed = 
      url.hostname.endsWith('fenixblack.ai') || 
      url.hostname === 'fenixblack.ai' ||
      url.hostname === 'localhost' || 
      url.hostname === '127.0.0.1' ||
      url.hostname.startsWith('192.168.') ||
      url.hostname.startsWith('10.') ||
      url.hostname.startsWith('172.');
    
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Fingerprint');
    }
  } catch {
    // Invalid origin, don't add headers
  }
  
  return response;
}

/**
 * Standard error responses with CORS support
 */
export const corsErrors = {
  unauthorized: (origin?: string | null) => {
    const response = errorResponse('UNAUTHORIZED', 'Invalid or missing API key', 401);
    return origin ? addCorsHeaders(response, origin) : response;
  },
  forbidden: (origin?: string | null) => {
    const response = errorResponse('FORBIDDEN', 'Access denied', 403);
    return origin ? addCorsHeaders(response, origin) : response;
  },
  notFound: (origin?: string | null) => {
    const response = errorResponse('NOT_FOUND', 'Resource not found', 404);
    return origin ? addCorsHeaders(response, origin) : response;
  },
  badRequest: (message?: string, origin?: string | null) => {
    const response = errorResponse('BAD_REQUEST', message, 400);
    return origin ? addCorsHeaders(response, origin) : response;
  },
  serverError: (message?: string, origin?: string | null) => {
    const response = errorResponse('INTERNAL_ERROR', message || 'An error occurred', 500);
    return origin ? addCorsHeaders(response, origin) : response;
  },
};
