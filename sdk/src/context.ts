import type { TrackContext } from './types';

export function getBrowserContext(): TrackContext {
  if (typeof window === 'undefined') {
    return {
      browser: 'unknown',
      os: 'unknown',
      device: 'desktop',
      screenResolution: '0x0',
      viewport: '0x0',
      url: '',
      referrer: '',
      userAgent: '',
    };
  }

  const ua = navigator.userAgent;
  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const device = detectDevice();

  return {
    browser,
    os,
    device,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href,
    referrer: document.referrer || '',
    userAgent: ua,
  };
}

function detectBrowser(ua: string): string {
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';
  return 'Other';
}

function detectOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

function detectDevice(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android.*Tablet|Tablet.*Android/i.test(ua);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

export function generateSessionId(): string {
  // Simple session ID based on timestamp and random value
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
