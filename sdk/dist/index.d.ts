import React$1 from 'react';
import { NextRequest, NextFetchEvent } from 'next/server';

type GrowthKitTheme = 'light' | 'dark' | 'auto';
interface GrowthKitConfig {
    apiKey?: string;
    publicKey?: string;
    apiUrl?: string;
    debug?: boolean;
    language?: 'en' | 'es';
    theme?: GrowthKitTheme;
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
    messages?: string[];
    invitedAt?: string;
    acceptedAt?: string;
    email?: string;
    count?: number;
}
interface AppBranding {
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
interface GrowthKitState {
    loading: boolean;
    initialized: boolean;
    error: Error | null;
    fingerprint: string | null;
    credits: number;
    usage: number;
    referralCode: string | null;
    creditsPaused: boolean;
    policy: GrowthKitPolicy | null;
    name: string | null;
    email: string | null;
    hasClaimedName: boolean;
    hasClaimedEmail: boolean;
    hasVerifiedEmail: boolean;
    waitlistEnabled: boolean;
    waitlistStatus: 'none' | 'waiting' | 'invited' | 'accepted';
    waitlistPosition: number | null;
    waitlistMessage?: string;
    shouldShowWaitlist: boolean;
    waitlist?: WaitlistData;
    app?: AppBranding;
}
interface CompleteActionOptions {
    creditsRequired?: number;
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
    joinProductWaitlist: (productTag: string, email: string) => Promise<boolean>;
    getProductWaitlistStatus: (productTag: string) => {
        isOnList: boolean;
        status: string;
    };
    acceptInvitation: () => Promise<boolean>;
    share: (options?: ShareOptions) => Promise<boolean>;
    getReferralLink: () => string;
    shouldShowSoftPaywall: () => boolean;
    canPerformAction: (action?: string) => boolean;
    track: (eventName: string, properties?: Record<string, any>) => void;
    setTheme: (theme: GrowthKitTheme) => void;
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
interface CompleteResponse {
    success: boolean;
    creditsRemaining: number;
    creditsConsumed: number;
}
interface ClaimResponse {
    claimed: boolean;
    name?: string;
    email?: string;
    creditsAwarded?: number;
    totalCredits?: number;
    reason?: string;
    message?: string;
    verificationSent?: boolean;
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
interface TrackedEvent {
    eventName: string;
    properties?: Record<string, any>;
    timestamp: number;
}
interface TrackContext {
    browser: string;
    os: string;
    device: 'desktop' | 'mobile' | 'tablet';
    screenResolution: string;
    viewport: string;
    url: string;
    referrer: string;
    userAgent: string;
    browserLanguage: string;
    widgetLanguage: string;
}
type GrowthKitHook = GrowthKitState & GrowthKitActions;

declare function useGrowthKit(): GrowthKitHook;

interface ThemeColors {
    background: string;
    backgroundSecondary: string;
    backgroundGlass: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    borderFocus: string;
    primary: string;
    primaryGradient: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    magenta: string;
    purple: string;
    violet: string;
    orange: string;
    pink: string;
    shadow: string;
    shadowSm: string;
    shadowLg: string;
    hover: string;
    active: string;
    inputBackground: string;
    inputBorder: string;
    inputPlaceholder: string;
    inputFocus: string;
    overlay: string;
}
declare const lightTheme: ThemeColors;
declare const darkTheme: ThemeColors;
/**
 * Get the effective theme, resolving 'auto' to 'light' or 'dark'
 */
declare function getEffectiveTheme(theme: GrowthKitTheme): 'light' | 'dark';
/**
 * Get theme colors based on the theme type
 */
declare function getThemeColors(theme: GrowthKitTheme): ThemeColors;
/**
 * Create CSS custom properties for theming
 * Useful for applying themes to components
 */
declare function createThemeVariables(theme: GrowthKitTheme): Record<string, string>;
/**
 * Listen to system theme changes
 */
declare function onSystemThemeChange(callback: (isDark: boolean) => void): () => void;
/**
 * Utility to create focus styles for inputs
 */
declare function getFocusStyles(theme: ThemeColors): {
    borderColor: string;
    boxShadow: string;
    backgroundColor: string;
};
/**
 * Utility to create hover styles for buttons
 */
declare function getButtonHoverStyles(theme: ThemeColors): {
    transform: string;
    boxShadow: string;
};

type Language = 'en' | 'es';
interface Translations {
    waitlist: {
        youreOnTheList: string;
        yourPosition: string;
        notifyEmail: string;
        earlyAccess: string;
        joinWaitlistMessage: string;
        enterYourEmail: string;
        emailRequired: string;
        invalidEmail: string;
        joinFailed: string;
        errorOccurred: string;
        joining: string;
        joinWaitlist: string;
        noSpam: string;
    };
    widget: {
        loading: string;
        waitlistActive: string;
        credits: string;
        creditsPausedTooltip: string;
        earnCredits: string;
        account: string;
        name: string;
        email: string;
        creditsLabel: string;
        notSet: string;
        earnMoreCredits: string;
        emailVerifiedSuccess: string;
        noVerificationToken: string;
        verificationFailed: string;
        errorMinimal: string;
        errorOffline: string;
        retry: string;
    };
    modal: {
        earnCredits: string;
        creditsPausedMessage: string;
        completeTasks: string;
        nameTab: string;
        emailTab: string;
        verifyTab: string;
        shareTab: string;
        enterYourName: string;
        earnCreditsName: string;
        tellUsName: string;
        yourName: string;
        claiming: string;
        claimCredits: string;
        enterYourEmail: string;
        earnCreditsEmail: string;
        provideEmail: string;
        yourEmail: string;
        verifyYourEmail: string;
        checkInbox: string;
        clickVerificationLink: string;
        earnVerificationCredits: string;
        shareAndEarn: string;
        earnCreditsEachFriend: string;
        copy: string;
        copied: string;
        shareNow: string;
        earnCreditsPerReferral: string;
        referralUnavailable: string;
        newCreditsPaused: string;
        currentCredits: string;
        done: string;
    };
}
interface LocalizationContextValue {
    language: Language;
    t: Translations;
    setLanguage?: (language: Language) => void;
}
declare function useLocalization(): LocalizationContextValue;
declare function useTranslation(): {
    t: (key: string, values?: Record<string, string | number>) => string;
    language: Language;
};

interface GrowthKitProviderProps {
    children: React$1.ReactNode;
    config: GrowthKitConfig;
}
declare function GrowthKitProvider({ children, config }: GrowthKitProviderProps): React$1.JSX.Element;

declare class GrowthKitAPI {
    private apiKey;
    private publicKey;
    private apiUrl;
    private fingerprint;
    private isProxyMode;
    private isPublicMode;
    private debug;
    private token;
    private tokenExpiry;
    private retryingRequest;
    private language;
    constructor(apiKey?: string, publicKey?: string, apiUrl?: string, debug?: boolean, language?: 'en' | 'es');
    private detectApiUrl;
    private detectProxyUrl;
    setFingerprint(fingerprint: string): void;
    setLanguage(language: 'en' | 'es'): void;
    private isTokenValid;
    private getStoredToken;
    private storeToken;
    private requestToken;
    private ensureValidToken;
    private transformEndpointForPublic;
    private request;
    getMe(fingerprint: string, claim?: string): Promise<APIResponse<MeResponse>>;
    completeAction(fingerprint: string, action?: string, creditsRequired?: number, usdValue?: number, metadata?: any): Promise<APIResponse<CompleteResponse>>;
    claimName(fingerprint: string, name: string): Promise<APIResponse<ClaimResponse>>;
    claimEmail(fingerprint: string, email: string): Promise<APIResponse<ClaimResponse>>;
    verifyEmail(fingerprint: string, token: string): Promise<APIResponse<VerifyResponse>>;
    joinWaitlist(email: string, fingerprint?: string, metadata?: any, productTag?: string): Promise<APIResponse<WaitlistResponse>>;
    trackReferralVisit(claim?: string): Promise<APIResponse<any>>;
    trackEvents(events: Array<{
        eventName: string;
        properties?: Record<string, any>;
        timestamp: number;
    }>, context?: any, sessionId?: string): Promise<APIResponse<{
        tracked: boolean;
    }>>;
    checkReferral(fingerprint: string, referralCode: string): Promise<APIResponse<any>>;
    redeemInvitation(fingerprint: string, invitationCode: string): Promise<APIResponse<any>>;
}

interface GrowthKitGateProps {
    children: React$1.ReactNode;
    loadingComponent?: React$1.ReactNode;
}
declare function GrowthKitGate({ children, loadingComponent }: GrowthKitGateProps): React$1.JSX.Element;

interface CreditExhaustionModalProps {
}
interface CreditExhaustionModalRef {
    open: () => void;
    close: () => void;
    isOpen: () => boolean;
}
declare const CreditExhaustionModal: React$1.ForwardRefExoticComponent<CreditExhaustionModalProps & React$1.RefAttributes<CreditExhaustionModalRef>>;

interface WaitlistFormProps {
    message?: string;
    onSuccess?: (position: number) => void;
    className?: string;
    style?: React$1.CSSProperties;
    productTag?: string;
    mode?: 'inline' | 'modal' | 'drawer';
    variant?: 'compact' | 'standard';
    hidePosition?: boolean;
    trigger?: React$1.ReactNode;
    drawerPosition?: 'left' | 'right';
    layout?: 'centered' | 'split' | 'minimal' | 'embed';
    targetSelector?: string;
}
/**
 * Modern waitlist form component with app branding
 * Supports both app-level (full-page) and product-level (embeddable) waitlists
 */
declare function WaitlistForm({ message, onSuccess, className, style, productTag, mode, variant, hidePosition, trigger, drawerPosition, layout: layoutProp, targetSelector, }: WaitlistFormProps): React$1.JSX.Element;

interface GrowthKitAccountWidgetProps {
    config: GrowthKitConfig;
    children: React$1.ReactNode;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
    theme?: GrowthKitTheme;
    slim?: boolean;
    slim_labels?: boolean;
    showName?: boolean;
    showEmail?: boolean;
    showCredits?: boolean;
    showLogo?: boolean;
    footerLogoUrl?: string;
    autoOpenCreditModal?: boolean;
    onCreditsChange?: (credits: number) => void;
    onProfileChange?: (profile: {
        name?: string;
        email?: string;
        verified?: boolean;
    }) => void;
    className?: string;
    style?: React$1.CSSProperties;
}
interface GrowthKitAccountWidgetRef {
    openEarnCreditsModal: () => void;
    refresh: () => Promise<void>;
    getCurrentBalance: () => number;
    getProfile: () => {
        name?: string;
        email?: string;
        verified?: boolean;
    };
    setLanguage: (language: 'en' | 'es') => void;
}
declare const GrowthKitAccountWidget: React$1.ForwardRefExoticComponent<GrowthKitAccountWidgetProps & React$1.RefAttributes<GrowthKitAccountWidgetRef>>;

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

/**
 * Static assets for GrowthKit SDK
 * Embedded as base64 to ensure they're always available
 */
declare const GROWTHKIT_LOGO_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAACDElEQVRIDe1Qz2sTQRR+M/szm2yVloKgELyUxranBq0eRb0rTUFQKNpb/wHRSxC8iAqCHioIgmgxKnoRT1It4qmWFq1YFRGhYhqr2TRNZvNmZ0wPgWXoJpF6UTqXed+8733fmw9g6/yzCZzzxoYyMqO1+oDeiqD2c3XRqeLui2Uhh5P57Xvq/TWVE8Z/ZJCRWfNegU50uPYo98Sy7kvz7xlIICtf3UuOGxsteRTMmvzuFmg5vO1Gdds/OPDhRpqZ2rj4qYF04oA19mAyfRI3Eg2/0TBoVle5O4Cyi/rQCaUiXajXV9f5Bz8/Sw7OzBhRs5EG++dyOwfnn+xrDAbc+YboAmPWMgZWZrUqtL2L05crnD61E8xu8NQ7MqI1Ht/FNXu6b/b5Q8r88526+bJQhiWC5BSTHTHdMV7pZqJXrJbe9AwsVVThBo40ENz6EvhmhSYSxwMdj+R/1MYtIxjh6P4ShvECUe8OyhoQZjy6T0aChqB6R0b0duhQvj78WFRtEMzqEsS9jSWHc988AWRbt6w5IFZqU7ZHr6iiYRxpsE4iqJ+VRT4HQRwkOgYG9gXwjX7JTJAe3oqje/T14bQXFlRroj6ouC+3sAMteh202DHpV4oawifQyeT74VTTzVWdpjgLWdp7d/FMz52Pfv/N+dNNyZtppibejaWuzSY3o9HGrGwZaxsiW5T/KYHfjWfJJrEJnEEAAAAASUVORK5CYII=";
/**
 * Logo component as React element
 * @param size - Size in pixels (both width and height)
 * @param className - Optional CSS class
 * @param style - Optional CSS styles
 */
interface LogoProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

declare const VERSION = "0.6.1";

export { APIResponse, AppBranding, ClaimResponse, CompleteActionOptions, CompleteResponse, CreditExhaustionModal, CreditExhaustionModalRef, GROWTHKIT_LOGO_ICON_BASE64, GrowthKitAPI, GrowthKitAccountWidget, GrowthKitAccountWidgetRef, GrowthKitActions, GrowthKitConfig, GrowthKitGate, GrowthKitHook, GrowthKitMiddlewareConfig, GrowthKitPolicy, GrowthKitProvider, GrowthKitServer, GrowthKitServerConfig, GrowthKitState, GrowthKitTheme, Language, LogoProps, MeResponse, ShareOptions, ThemeColors, TrackContext, TrackedEvent, Translations, VERSION, VerifyResponse, WaitlistData, WaitlistForm, WaitlistFormProps, WaitlistResponse, clearFingerprintCache, createGrowthKitMiddleware, createGrowthKitServer, createThemeVariables, darkTheme, getButtonHoverStyles, getEffectiveTheme, getFingerprint, getFingerprintFromRequest, getFocusStyles, getReferralClaimFromRequest, getThemeColors, growthKitMiddleware, lightTheme, onSystemThemeChange, useGrowthKit, useLocalization, useTranslation };
