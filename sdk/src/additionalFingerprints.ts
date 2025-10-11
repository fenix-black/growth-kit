/**
 * Additional client-side fingerprinting methods for enhanced cross-domain user matching
 * These complement the primary FingerprintJS method with alternative identification techniques
 */

/**
 * Generate a canvas-based fingerprint
 * Canvas rendering produces slightly different pixel outputs across browsers/devices
 * This is highly unique and domain-independent
 * 
 * @returns 32-character hex hash
 */
export async function getCanvasFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return '';
    }

    // Draw distinctive patterns that vary by browser/system
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    ctx.fillText('GrowthKit 🚀', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = 'bold 18pt Times';
    ctx.fillText('Canvas Test', 4, 45);

    // Get canvas data
    const canvasData = canvas.toDataURL();
    
    // Hash the canvas data
    const encoder = new TextEncoder();
    const data = encoder.encode(canvasData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.substring(0, 32);
  } catch (error) {
    console.warn('[GrowthKit] Canvas fingerprint failed:', error);
    return '';
  }
}

/**
 * Generate a browser signature fingerprint
 * Combines various browser properties into a stable hash
 * Less unique than canvas but still useful as a fallback
 * 
 * @returns 32-character hex hash
 */
export async function getBrowserSignatureFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const components: string[] = [];
    
    // Screen properties
    components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
    components.push(`${window.screen.availWidth}x${window.screen.availHeight}`);
    
    // Navigator properties
    components.push(navigator.userAgent);
    components.push(navigator.language);
    components.push(navigator.languages?.join(',') || '');
    components.push(navigator.platform);
    components.push(`${navigator.hardwareConcurrency || 0}`);
    components.push(`${navigator.maxTouchPoints || 0}`);
    
    // Timezone
    components.push(`${new Date().getTimezoneOffset()}`);
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    
    // WebGL (if available)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push((gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
          components.push((gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
        }
      }
    } catch (e) {
      // WebGL not available
    }
    
    // Fonts (basic check)
    if (document.fonts) {
      components.push(`fonts:${document.fonts.size}`);
    }
    
    // Media devices (if available)
    if (navigator.mediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        components.push(`media:${devices.length}`);
      } catch (e) {
        // Media devices not accessible
      }
    }
    
    // Combine and hash
    const combined = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.substring(0, 32);
  } catch (error) {
    console.warn('[GrowthKit] Browser signature fingerprint failed:', error);
    return '';
  }
}

