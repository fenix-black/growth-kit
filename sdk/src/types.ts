export type GrowthKitTheme = 'light' | 'dark' | 'auto';

export interface GrowthKitConfig {
  apiKey?: string;
  publicKey?: string;
  apiUrl?: string;
  debug?: boolean;
  language?: 'en' | 'es';
  theme?: GrowthKitTheme;
}

export interface GrowthKitPolicy {
  referralCredits: number;
  referredCredits: number;
  nameClaimCredits: number;
  emailClaimCredits: number;
  emailVerifyCredits: number;
  dailyReferralCap: number;
  actions: Record<string, { creditsRequired: number }>;
}

export interface WaitlistData {
  enabled: boolean;
  status: 'none' | 'waiting' | 'invited' | 'accepted';
  position: number | null;
  requiresWaitlist?: boolean;
  message?: string; // Deprecated: single message for backwards compatibility
  messages?: string[]; // Array of custom messages from app settings
  invitedAt?: string;
  acceptedAt?: string;
  email?: string;
  count?: number; // Total waitlist count for display
}

export interface AppBranding {
  name: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  waitlistLayout?: 'centered' | 'split' | 'minimal' | 'embed';
  hideGrowthKitBranding: boolean;
  metadata?: any;
}

export interface GrowthKitState {
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  fingerprint: string | null;
  credits: number;
  usage: number;
  referralCode: string | null;
  creditsPaused: boolean;
  policy: GrowthKitPolicy | null;
  // User profile
  name: string | null;
  email: string | null;
  hasClaimedName: boolean;
  hasClaimedEmail: boolean;
  hasVerifiedEmail: boolean;
  // Waitlist state
  waitlistEnabled: boolean;
  waitlistStatus: 'none' | 'waiting' | 'invited' | 'accepted';
  waitlistPosition: number | null;
  waitlistMessage?: string;
  shouldShowWaitlist: boolean;
  waitlist?: WaitlistData; // Full waitlist data including count
  // App branding
  app?: AppBranding;
}

export interface CompleteActionOptions {
  creditsRequired?: number;
  usdValue?: number;
  metadata?: any;
}

export interface GrowthKitActions {
  refresh: () => Promise<void>;
  completeAction: (action?: string, options?: CompleteActionOptions | any) => Promise<boolean>;
  claimName: (name: string) => Promise<boolean>;
  claimEmail: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  joinWaitlist: (email: string, metadata?: any) => Promise<boolean>;
  joinProductWaitlist: (productTag: string, email: string) => Promise<boolean>;
  getProductWaitlistStatus: (productTag: string) => { isOnList: boolean; status: string };
  acceptInvitation: () => Promise<boolean>;
  share: (options?: ShareOptions) => Promise<boolean>;
  getReferralLink: () => string;
  shouldShowSoftPaywall: () => boolean;
  canPerformAction: (action?: string) => boolean;
  track: (eventName: string, properties?: Record<string, any>) => void;
  setTheme: (theme: GrowthKitTheme) => void;
}

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MeResponse {
  fingerprint: string;
  credits: number;
  usage: number;
  referralCode: string;
  creditsPaused: boolean;
  policy: GrowthKitPolicy;
  name: string | null;
  email: string | null;
  hasClaimedName: boolean;
  hasClaimedEmail: boolean;
  hasVerifiedEmail: boolean;
  waitlist?: WaitlistData;
  app?: AppBranding;
}

export interface CompleteResponse {
  success: boolean;
  creditsRemaining: number;
  creditsConsumed: number;
}

export interface ClaimResponse {
  claimed: boolean;
  name?: string;
  email?: string;
  creditsAwarded?: number;
  totalCredits?: number;
  reason?: string;
  message?: string;
  verificationSent?: boolean;
}

export interface VerifyResponse {
  verified: boolean;
  creditsAwarded?: number;
  totalCredits?: number;
  reason?: string;
  message?: string;
}

export interface WaitlistResponse {
  joined: boolean;
  position?: number;
  status?: string;
  reason?: string;
  message?: string;
}

export interface TrackedEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp: number;
}

export interface TrackContext {
  browser: string;
  os: string;
  device: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  viewport: string;
  url: string;
  referrer: string;
  userAgent: string;
  browserLanguage: string;  // Detected from navigator.language
  widgetLanguage: string;   // Set programmatically by parent website
}

export type GrowthKitHook = GrowthKitState & GrowthKitActions;
