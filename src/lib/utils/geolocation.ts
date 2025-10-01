export interface GeolocationData {
  city: string | null;
  country: string | null;
  region: string | null;
  [key: string]: string | null; // Index signature for Prisma JSON compatibility
}

/**
 * Get geolocation data from IP address
 */
export function getGeolocation(ip: string): GeolocationData {
  // Skip localhost/private IPs
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { city: null, country: null, region: null };
  }

  try {
    // Dynamic import to avoid loading during build time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return { city: null, country: null, region: null };
    }

    return {
      city: geo.city || null,
      country: geo.country || null,
      region: geo.region || null,
    };
  } catch (error) {
    // Fallback if geoip-lite fails to load
    console.warn('[Geolocation] Failed to load geoip-lite:', error);
    return { city: null, country: null, region: null };
  }
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
