// Main hook export
export { useGrowthKit } from './useGrowthKit';

// Type exports for TypeScript users
export type {
  GrowthKitConfig,
  GrowthKitState,
  GrowthKitActions,
  GrowthKitHook,
  GrowthKitPolicy,
  ShareOptions,
  APIResponse,
  MeResponse,
  CompleteResponse,
  ClaimResponse,
  VerifyResponse,
  WaitlistResponse,
} from './types';

// Middleware exports for Next.js
export {
  createGrowthKitMiddleware,
  growthKitMiddleware,
} from './middleware';
export type { GrowthKitMiddlewareConfig } from './middleware';

// Server-side utilities
export {
  GrowthKitServer,
  createGrowthKitServer,
  getFingerprintFromRequest,
  getReferralClaimFromRequest,
} from './server';
export type { GrowthKitServerConfig } from './server';

// Client-side utilities
export { getFingerprint, clearFingerprintCache } from './fingerprint';

// API client export (for advanced users)
export { GrowthKitAPI } from './api';

// Version
export const VERSION = '0.3.0';
