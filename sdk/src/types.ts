export interface GrowthKitConfig {
  apiKey: string;
  apiUrl?: string;
  debug?: boolean;
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

export interface GrowthKitState {
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  fingerprint: string | null;
  credits: number;
  usage: number;
  referralCode: string | null;
  policy: GrowthKitPolicy | null;
  hasClaimedName: boolean;
  hasClaimedEmail: boolean;
  hasVerifiedEmail: boolean;
  isOnWaitlist: boolean;
  waitlistPosition: number | null;
}

export interface GrowthKitActions {
  refresh: () => Promise<void>;
  completeAction: (action?: string, metadata?: any) => Promise<boolean>;
  claimName: (name: string) => Promise<boolean>;
  claimEmail: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  joinWaitlist: (email: string, metadata?: any) => Promise<boolean>;
  share: (options?: ShareOptions) => Promise<boolean>;
  getReferralLink: () => string;
  shouldShowSoftPaywall: () => boolean;
  canPerformAction: (action?: string) => boolean;
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
  policy: GrowthKitPolicy;
  hasClaimedName: boolean;
  hasClaimedEmail: boolean;
  hasVerifiedEmail: boolean;
}

export interface CompleteResponse {
  success: boolean;
  creditsRemaining: number;
  creditsConsumed: number;
}

export interface ClaimResponse {
  claimed: boolean;
  creditsAwarded?: number;
  totalCredits?: number;
  reason?: string;
  message?: string;
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

export type GrowthKitHook = GrowthKitState & GrowthKitActions;
