/**
 * SDK Auto-Update Loader
 * Manages automatic updates of the SDK by fetching the latest version from the CDN
 */

import { VERSION } from './browser';

export interface SdkVersionInfo {
  version: string;
  buildHash: string;
  buildTime: string;
  fullVersion: string;
  bundleUrl: string;
  forceUpdate: boolean;
  minVersion?: string;
  reason?: string;
}

export interface SdkLoaderConfig {
  enabled: boolean;
  apiUrl: string;
  cacheTTL: number; // milliseconds
  timeout: number; // milliseconds
  debug: boolean;
}

interface CachedSdk {
  version: string;
  buildHash: string;
  timestamp: number;
  // Bundle would be stored separately in production
}

const STORAGE_KEY = 'growthkit_sdk_cache';
const VERSION_CHECK_KEY = 'growthkit_version_check';

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get cached SDK info
 */
function getCachedInfo(): CachedSdk | null {
  if (!isBrowser()) return null;
  
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    
    return JSON.parse(cached) as CachedSdk;
  } catch (error) {
    console.warn('[GrowthKit SDK Loader] Failed to read cache:', error);
    return null;
  }
}

/**
 * Save SDK info to cache
 */
function setCachedInfo(info: CachedSdk): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn('[GrowthKit SDK Loader] Failed to write cache:', error);
  }
}

/**
 * Get last version check timestamp
 */
function getLastCheckTime(): number {
  if (!isBrowser()) return 0;
  
  try {
    const timestamp = localStorage.getItem(VERSION_CHECK_KEY);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Update last version check timestamp
 */
function setLastCheckTime(timestamp: number): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(VERSION_CHECK_KEY, timestamp.toString());
  } catch (error) {
    console.warn('[GrowthKit SDK Loader] Failed to update check time:', error);
  }
}

/**
 * Check if cache is still valid based on TTL
 */
function isCacheValid(config: SdkLoaderConfig): boolean {
  const lastCheck = getLastCheckTime();
  const now = Date.now();
  const elapsed = now - lastCheck;
  
  return elapsed < config.cacheTTL;
}

/**
 * Fetch version info from server
 */
async function fetchVersionInfo(
  config: SdkLoaderConfig
): Promise<SdkVersionInfo | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    const response = await fetch(`${config.apiUrl}/sdk/version`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Version check failed: ${response.status}`);
    }
    
    const versionInfo: SdkVersionInfo = await response.json();
    return versionInfo;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (config.debug) {
      console.warn('[GrowthKit SDK Loader] Version check failed:', error);
    }
    
    return null;
  }
}

/**
 * Get current bundled SDK version
 */
export function getCurrentVersion(): string {
  return VERSION;
}

/**
 * Get current SDK load source
 */
export function getSdkLoadSource(): 'bundled' | 'cache' | 'cdn' {
  // In the current implementation, we're always using the bundled version
  // Future: Could track if loaded from CDN dynamically
  return 'bundled';
}

/**
 * Check for SDK updates
 * This is a passive check - it logs but doesn't actually reload the SDK yet
 */
export async function checkForUpdates(
  config: SdkLoaderConfig
): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  forceUpdate: boolean;
}> {
  if (!config.enabled) {
    return {
      hasUpdate: false,
      currentVersion: getCurrentVersion(),
      forceUpdate: false,
    };
  }
  
  // Check if we need to check for updates (TTL)
  if (isCacheValid(config) && !config.debug) {
    if (config.debug) {
      console.log('[GrowthKit SDK Loader] Using cached version info (within TTL)');
    }
    
    return {
      hasUpdate: false,
      currentVersion: getCurrentVersion(),
      forceUpdate: false,
    };
  }
  
  // Fetch latest version info
  const versionInfo = await fetchVersionInfo(config);
  
  if (!versionInfo) {
    // Failed to check, use bundled version
    return {
      hasUpdate: false,
      currentVersion: getCurrentVersion(),
      forceUpdate: false,
    };
  }
  
  // Update last check time
  setLastCheckTime(Date.now());
  
  // Compare versions
  const currentVersion = getCurrentVersion();
  const hasUpdate = versionInfo.version !== currentVersion || 
                    versionInfo.forceUpdate;
  
  if (config.debug) {
    console.log('[GrowthKit SDK Loader] Version check:', {
      current: currentVersion,
      latest: versionInfo.version,
      hasUpdate,
      forceUpdate: versionInfo.forceUpdate,
      buildHash: versionInfo.buildHash,
    });
  }
  
  // Update cache
  if (hasUpdate) {
    setCachedInfo({
      version: versionInfo.version,
      buildHash: versionInfo.buildHash,
      timestamp: Date.now(),
    });
    
    if (config.debug) {
      console.log('[GrowthKit SDK Loader] New version available:', versionInfo.version);
      
      if (versionInfo.forceUpdate) {
        console.warn('[GrowthKit SDK Loader] FORCE UPDATE required:', versionInfo.reason);
      }
    }
  }
  
  return {
    hasUpdate,
    currentVersion,
    latestVersion: versionInfo.version,
    forceUpdate: versionInfo.forceUpdate,
  };
}

/**
 * Track SDK version usage on the server
 */
export async function trackSdkVersion(
  apiUrl: string,
  appId: string,
  fingerprintId: string,
  sdkVersion: string,
  loadSource: 'bundled' | 'cache' | 'cdn',
  debug: boolean = false
): Promise<void> {
  try {
    // This would be called from the SDK initialization
    // For now, we'll just log it
    if (debug) {
      console.log('[GrowthKit SDK Loader] Tracking SDK version:', {
        appId,
        fingerprintId: fingerprintId.substring(0, 10) + '...',
        sdkVersion,
        loadSource,
      });
    }
    
    // TODO: Implement server-side tracking endpoint
    // await fetch(`${apiUrl}/sdk/track`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     appId,
    //     fingerprintId,
    //     sdkVersion,
    //     loadSource,
    //     bundleSize: 323000, // Could be calculated
    //     loadTime: performance.now(),
    //   }),
    // });
  } catch (error) {
    if (debug) {
      console.warn('[GrowthKit SDK Loader] Failed to track version:', error);
    }
  }
}

