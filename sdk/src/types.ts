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

export interface WaitlistData {
  enabled: boolean;
  status: 'none' | 'waiting' | 'invited' | 'accepted';
  position: number | null;
  requiresWaitlist?: boolean;
  message?: string;
  invitedAt?: string;
  acceptedAt?: string;
  email?: string;
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
  acceptInvitation: () => Promise<boolean>;
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
  name: string | null;
  email: string | null;
  hasClaimedName: boolean;
  hasClaimedEmail: boolean;
  hasVerifiedEmail: boolean;
  waitlist?: WaitlistData;
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

export type GrowthKitHook = GrowthKitState & GrowthKitActions;
