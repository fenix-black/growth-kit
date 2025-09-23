import React, { ReactNode } from 'react';
import { NextRequest, NextFetchEvent } from 'next/server';

interface GrowthKitConfig {
    apiKey: string;
    apiUrl?: string;
    debug?: boolean;
}
interface GrowthKitPolicy {
    referralCredits: number;
    referredCredits: number;
    nameClaimCredits: number;
    emailClaimCredits: number;
    emailVerifyCredits: number;
    dailyReferralCap: number;
    actions: Record<string, {
        creditsRequired: number;
    }>;
}
interface WaitlistData {
    enabled: boolean;
    status: 'none' | 'waiting' | 'invited' | 'accepted';
    position: number | null;
    requiresWaitlist?: boolean;
    message?: string;
    invitedAt?: string;
    acceptedAt?: string;
    email?: string;
}
interface GrowthKitState {
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
    waitlistEnabled: boolean;
    waitlistStatus: 'none' | 'waiting' | 'invited' | 'accepted';
    waitlistPosition: number | null;
    waitlistMessage?: string;
    shouldShowWaitlist: boolean;
    totalUsdSpent?: number;
    lastUsdTransaction?: number;
    usdTrackingEnabled?: boolean;
}
interface CompleteActionOptions {
    usdValue?: number;
    metadata?: any;
}
interface GrowthKitActions {
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
interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
}
interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
interface MeResponse {
    fingerprint: string;
    credits: number;
    usage: number;
    referralCode: string;
    policy: GrowthKitPolicy;
    hasClaimedName: boolean;
    hasClaimedEmail: boolean;
    hasVerifiedEmail: boolean;
    waitlist?: WaitlistData;
    totalUsdSpent?: number;
    usdTrackingEnabled?: boolean;
}
interface CompleteResponse {
    success: boolean;
    creditsRemaining: number;
    creditsConsumed: number;
    usdValue?: number;
    totalUsdSpent?: number;
}
interface ClaimResponse {
    claimed: boolean;
    creditsAwarded?: number;
    totalCredits?: number;
    reason?: string;
    message?: string;
}
interface VerifyResponse {
    verified: boolean;
    creditsAwarded?: number;
    totalCredits?: number;
    reason?: string;
    message?: string;
}
interface WaitlistResponse {
    joined: boolean;
    position?: number;
    status?: string;
    reason?: string;
    message?: string;
}
type GrowthKitHook = GrowthKitState & GrowthKitActions;

declare function useGrowthKit(config: GrowthKitConfig): GrowthKitHook;

interface GrowthKitGateProps {
    config: GrowthKitConfig;
    children: ReactNode;
    waitlistComponent?: ReactNode;
    loadingComponent?: ReactNode;
}
/**
 * GrowthKitGate component - Gates content behind waitlist when enabled
 *
 * @example
 * ```tsx
 * <GrowthKitGate config={{ apiKey: 'your-api-key' }}>
 *   <YourApp />
 * </GrowthKitGate>
 * ```
 */
declare function GrowthKitGate({ config, children, waitlistComponent, loadingComponent, }: GrowthKitGateProps): React.JSX.Element;

interface WaitlistFormProps {
    growthKit: GrowthKitHook;
    message?: string;
    onSuccess?: (position: number) => void;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * Default waitlist form component
 *
 * @example
 * ```tsx
 * <WaitlistForm
 *   growthKit={useGrowthKit(config)}
 *   message="Join our exclusive waitlist!"
 * />
 * ```
 */
declare function WaitlistForm({ growthKit, message, onSuccess, className, style }: WaitlistFormProps): React.JSX.Element;

interface GrowthKitMiddlewareConfig {
    apiKey: string;
    apiUrl: string;
    referralPath?: string;
    redirectTo?: string;
    debug?: boolean;
}
declare function createGrowthKitMiddleware(config: GrowthKitMiddlewareConfig): (request: NextRequest, event?: NextFetchEvent) => Promise<any>;
declare function growthKitMiddleware(request: NextRequest, event?: NextFetchEvent): Promise<any>;

/**
 * Server-side utilities for GrowthKit
 * These utilities are meant to be used in API routes and server components
 */

interface GrowthKitServerConfig {
    apiKey: string;
    apiUrl?: string;
}
/**
 * Server-side API client for GrowthKit
 * Use this in API routes and server components
 */
declare class GrowthKitServer {
    private apiKey;
    private apiUrl;
    constructor(config: GrowthKitServerConfig);
    /**
     * Get user data by fingerprint
     */
    getUser(fingerprint: string): Promise<any>;
    /**
     * Complete an action for a user
     */
    completeAction(fingerprint: string, action?: string, metadata?: any): Promise<any>;
    /**
     * Add email to waitlist
     */
    addToWaitlist(email: string, fingerprint?: string, metadata?: any): Promise<any>;
    /**
     * Exchange referral code for claim token
     */
    exchangeReferralCode(code: string): Promise<any>;
}
/**
 * Extract fingerprint from request headers (if using custom header)
 */
declare function getFingerprintFromRequest(request: NextRequest): string | null;
/**
 * Extract referral claim from request cookies
 */
declare function getReferralClaimFromRequest(request: NextRequest): string | null;
/**
 * Create a server instance with environment variables
 */
declare function createGrowthKitServer(): GrowthKitServer;

declare function getFingerprint(): Promise<string>;
declare function clearFingerprintCache(): void;

declare class GrowthKitAPI {
    private apiKey;
    private apiUrl;
    private fingerprint;
    constructor(apiKey: string, apiUrl?: string);
    private detectApiUrl;
    setFingerprint(fingerprint: string): void;
    private request;
    getMe(fingerprint: string, claim?: string): Promise<APIResponse<MeResponse>>;
    completeAction(fingerprint: string, action?: string, usdValue?: number, metadata?: any): Promise<APIResponse<CompleteResponse>>;
    claimName(fingerprint: string, name: string): Promise<APIResponse<ClaimResponse>>;
    claimEmail(fingerprint: string, email: string): Promise<APIResponse<ClaimResponse>>;
    verifyEmail(fingerprint: string, token: string): Promise<APIResponse<VerifyResponse>>;
    joinWaitlist(email: string, fingerprint?: string, metadata?: any): Promise<APIResponse<WaitlistResponse>>;
    trackReferralVisit(claim?: string): Promise<APIResponse<any>>;
}

declare const VERSION = "0.0.4";

export { APIResponse, ClaimResponse, CompleteResponse, GrowthKitAPI, GrowthKitActions, GrowthKitConfig, GrowthKitGate, GrowthKitGateProps, GrowthKitHook, GrowthKitMiddlewareConfig, GrowthKitPolicy, GrowthKitServer, GrowthKitServerConfig, GrowthKitState, MeResponse, ShareOptions, VERSION, VerifyResponse, WaitlistData, WaitlistForm, WaitlistFormProps, WaitlistResponse, clearFingerprintCache, createGrowthKitMiddleware, createGrowthKitServer, getFingerprint, getFingerprintFromRequest, getReferralClaimFromRequest, growthKitMiddleware, useGrowthKit };
