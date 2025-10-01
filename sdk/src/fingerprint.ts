import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;
let fpAgent: any = null;

// Storage key for persistent fingerprint
const FINGERPRINT_STORAGE_KEY = 'growthkit_fingerprint';

export async function getFingerprint(): Promise<string> {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return a placeholder during SSR that will be replaced on client
    return 'ssr_placeholder_' + Math.random().toString(36).substring(7);
  }

  // Try to get stored fingerprint first (persists across page reloads)
  try {
    const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (stored) {
      cachedFingerprint = stored;
      console.log('[GrowthKit] Using stored fingerprint:', stored.substring(0, 10) + '...');
      return stored;
    }
  } catch (error) {
    // localStorage might be blocked (Safari private mode, etc.)
    console.warn('[GrowthKit] Could not access localStorage for fingerprint:', error);
  }

  try {
    // Wait for the browser environment to be fully ready
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(undefined);
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });
    }

    // Initialize FingerprintJS agent (only once)
    if (!fpAgent) {
      fpAgent = await FingerprintJS.load();
    }

    // Get browser fingerprint using FingerprintJS
    const result = await fpAgent.get();
    const fingerprint = result.visitorId;
    
    console.log('[GrowthKit] FingerprintJS generated:', fingerprint.substring(0, 10) + '...');
    
    if (!fingerprint || fingerprint.length === 0) {
      throw new Error('Empty fingerprint generated');
    }

    // Cache the fingerprint in memory
    cachedFingerprint = fingerprint;
    
    // Store fingerprint in localStorage for persistence across page reloads
    try {
      localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
      console.log('[GrowthKit] Fingerprint stored in localStorage');
    } catch (error) {
      console.warn('[GrowthKit] Could not store fingerprint:', error);
    }
    
    return fingerprint;
  } catch (error) {
    // Fallback to a simple fingerprint if FingerprintJS fails
    console.warn('[GrowthKit] Fingerprint generation failed, using fallback:', error);
    
    // Generate a fallback fingerprint using available browser properties
    const fallback = generateFallbackFingerprint();
    cachedFingerprint = fallback;
    
    // Store fallback fingerprint too
    try {
      localStorage.setItem(FINGERPRINT_STORAGE_KEY, fallback);
    } catch (storageError) {
      // Silent fail if localStorage is unavailable
    }
    
    return fallback;
  }
}

function generateFallbackFingerprint(): string {
  const components: string[] = [];
  
  // Screen properties
  if (typeof window !== 'undefined' && window.screen) {
    components.push(`${window.screen.width}x${window.screen.height}`);
    components.push(`${window.screen.colorDepth}`);
  }
  
  // Navigator properties
  if (typeof navigator !== 'undefined') {
    components.push(navigator.userAgent || 'unknown');
    components.push(navigator.language || 'en');
    components.push(navigator.platform || 'unknown');
    components.push(`${navigator.hardwareConcurrency || 0}`);
  }
  
  // Timezone
  components.push(`${new Date().getTimezoneOffset()}`);
  
  // Create a simple hash from components
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `fallback_${Math.abs(hash).toString(36)}`;
}

export function clearFingerprintCache(): void {
  cachedFingerprint = null;
  
  // Also clear from localStorage
  try {
    localStorage.removeItem(FINGERPRINT_STORAGE_KEY);
  } catch (error) {
    // Silent fail if localStorage is unavailable
  }
}
