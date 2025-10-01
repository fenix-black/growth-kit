import { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/middleware/rateLimitSafe';
import { getGeolocation } from '@/lib/utils/geolocation';
import { successResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const location = getGeolocation(clientIp, request.headers);
  
  // Get all IP-related headers
  const headers: Record<string, string | null> = {
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'x-vercel-forwarded-for': request.headers.get('x-vercel-forwarded-for'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
  };
  
  return successResponse({
    detectedIp: clientIp,
    location,
    headers,
    allHeaders: Array.from(request.headers.entries()).reduce((acc, [key, value]) => {
      if (key.toLowerCase().includes('ip') || key.toLowerCase().includes('forward')) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>),
  });
}


