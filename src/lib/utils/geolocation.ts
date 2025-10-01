export interface GeolocationData {
  city: string | null;
  country: string | null;
  region: string | null;
  [key: string]: string | null; // Index signature for Prisma JSON compatibility
}

/**
 * Get geolocation data from IP address
 * Uses Vercel's built-in geolocation headers (free, no downloads)
 * For local development, gracefully returns null (location not critical for localhost)
 */
export function getGeolocation(ip: string, headers?: Headers): GeolocationData {
  // Use Vercel's geolocation headers (available in production on Vercel)
  if (headers) {
    const city = headers.get('x-vercel-ip-city');
    const country = headers.get('x-vercel-ip-country');
    const region = headers.get('x-vercel-ip-country-region');
    
    if (city || country) {
      return {
        city: city || null,
        country: country || null,
        region: region || null,
      };
    }
  }
  
  // For localhost/private IPs or missing headers, return null
  // Location is not critical for development environments
  return { city: null, country: null, region: null };
}

/**
 * Detect browser from user agent
 */
export function detectBrowser(userAgent: string): string | null {
  if (!userAgent) return null;
  
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';
  
  return 'Other';
}

/**
 * Detect device type from user agent
 */
export function detectDevice(userAgent: string): string | null {
  if (!userAgent) return null;
  
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android.*Tablet|Tablet.*Android/i.test(userAgent);
  
  if (isTablet) return 'Tablet';
  if (isMobile) return 'Mobile';
  return 'Desktop';
}
