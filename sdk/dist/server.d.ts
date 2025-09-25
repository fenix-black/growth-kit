import { NextRequest } from 'next/server';

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

export { GrowthKitServer, GrowthKitServerConfig, createGrowthKitServer, getFingerprintFromRequest, getReferralClaimFromRequest };
