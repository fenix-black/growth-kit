// @ts-ignore - broprint.js doesn't have TypeScript definitions
import { getCurrentBrowserFingerPrint } from '@rajesh896/broprint.js';

let cachedFingerprint: string | null = null;

export async function getFingerprint(): Promise<string> {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    // Get browser fingerprint using broprint.js
    const fingerprint = await getCurrentBrowserFingerPrint();
    
    if (!fingerprint || typeof fingerprint !== 'string') {
      throw new Error('Invalid fingerprint generated');
    }

    // Cache the fingerprint for the session
    cachedFingerprint = fingerprint;
    
    return fingerprint;
  } catch (error) {
    // Fallback to a simple fingerprint if broprint.js fails
    console.warn('Fingerprint generation failed, using fallback:', error);
    
    // Generate a fallback fingerprint using available browser properties
    const fallback = generateFallbackFingerprint();
    cachedFingerprint = fallback;
    
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
}
