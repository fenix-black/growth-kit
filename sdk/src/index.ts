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
  WaitlistData,
} from './types';

// Component exports
export {
  GrowthKitProvider,
  GrowthKitGate,
  WaitlistForm,
  CreditExhaustionModal,
  GrowthKitAccountWidget,
} from './components';
export type {
  WaitlistFormProps,
  CreditExhaustionModalRef,
  GrowthKitAccountWidgetRef,
} from './components';

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

// Localization exports
export { useLocalization, useTranslation } from './localization';
export type { Language, Translations } from './localization';

// Version
export const VERSION = '0.0.4';
