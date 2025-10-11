// Browser-only entry point for UMD bundle
// Excludes server-side utilities, middleware, and Node.js-specific code

// Main hook export
export { useGrowthKit } from './useGrowthKit';

// Type exports for TypeScript users
export type {
  GrowthKitConfig,
  GrowthKitState,
  GrowthKitActions,
  GrowthKitHook,
  GrowthKitPolicy,
  GrowthKitTheme,
  ShareOptions,
  CompleteActionOptions,
  TrackedEvent,
  TrackContext,
  APIResponse,
  MeResponse,
  CompleteResponse,
  ClaimResponse,
  VerifyResponse,
  WaitlistResponse,
  WaitlistData,
  AppBranding,
} from './types';

// Theme system exports
export type { ThemeColors } from './theme';
export {
  getEffectiveTheme,
  getThemeColors,
  createThemeVariables,
  onSystemThemeChange,
  getFocusStyles,
  getButtonHoverStyles,
  lightTheme,
  darkTheme,
} from './theme';

// Component exports (browser-only)
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

// Client-side utilities
export { getFingerprint, getAllFingerprints, clearFingerprintCache } from './fingerprint';

// Assets exports
export { GROWTHKIT_LOGO_ICON_BASE64 } from './assets';
export type { LogoProps } from './assets';

// API client export (for advanced users)
export { GrowthKitAPI } from './api';

// Localization exports
export { useLocalization, useTranslation } from './localization';
export type { Language, Translations } from './localization';

// Version - will be replaced by build
export const VERSION = '__SDK_VERSION__';

