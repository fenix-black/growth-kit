// @ts-ignore - broprint.js doesn't have TypeScript definitions
import { getCurrentBrowserFingerPrint } from '@rajesh896/broprint.js';

let cachedFingerprint: string | null = null;

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

    // Get browser fingerprint using broprint.js
    const fingerprintResult: any = await getCurrentBrowserFingerPrint();
    
    console.log('[GrowthKit] Fingerprint result type:', typeof fingerprintResult);
    
    let fingerprint: string;
    
    // Handle different possible return formats from broprint.js
    if (fingerprintResult && typeof fingerprintResult === 'object') {
      // The library might return an object with the fingerprint as a property
      if ('hash' in fingerprintResult) {
        fingerprint = String(fingerprintResult.hash);
      } else if ('fingerprint' in fingerprintResult) {
        fingerprint = String(fingerprintResult.fingerprint);
      } else if ('id' in fingerprintResult) {
        fingerprint = String(fingerprintResult.id);
      } else {
        // If it's an object but we don't know the structure, stringify it
        fingerprint = JSON.stringify(fingerprintResult);
      }
    } else if (fingerprintResult && typeof fingerprintResult === 'string') {
      fingerprint = fingerprintResult;
    } else if (fingerprintResult && typeof fingerprintResult === 'number') {
      fingerprint = fingerprintResult.toString();
    } else {
      // If the result is not valid, throw an error to trigger fallback
      throw new Error(`Invalid fingerprint type: ${typeof fingerprintResult}`);
    }
    
    if (!fingerprint || fingerprint.length === 0) {
      throw new Error('Empty fingerprint generated');
    }

    // Cache the fingerprint for the session
    cachedFingerprint = fingerprint;
    
    console.log('[GrowthKit] Fingerprint generated successfully:', fingerprint.substring(0, 10) + '...');
    
    return fingerprint;
  } catch (error) {
    // Fallback to a simple fingerprint if broprint.js fails
    console.warn('[GrowthKit] Fingerprint generation failed, using fallback:', error);
    
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
