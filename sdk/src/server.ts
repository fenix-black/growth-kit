/**
 * Server-side utilities for GrowthKit
 * These utilities are meant to be used in API routes and server components
 */

import type { NextRequest } from 'next/server';

export interface GrowthKitServerConfig {
  apiKey: string;
  apiUrl?: string;
}

/**
 * Server-side API client for GrowthKit
 * Use this in API routes and server components
 */
export class GrowthKitServer {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: GrowthKitServerConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || process.env.GROWTHKIT_API_URL || 'http://localhost:3000/api';
  }

  /**
   * Get user data by fingerprint
   */
  async getUser(fingerprint: string) {
    const response = await fetch(`${this.apiUrl}/v1/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ fingerprint }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Complete an action for a user
   */
  async completeAction(fingerprint: string, action: string = 'default', metadata?: any) {
    const response = await fetch(`${this.apiUrl}/v1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        fingerprint,
        action,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete action: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add email to waitlist
   */
  async addToWaitlist(email: string, fingerprint?: string, metadata?: any) {
    const response = await fetch(`${this.apiUrl}/v1/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        email,
        fingerprint,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add to waitlist: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Exchange referral code for claim token
   */
  async exchangeReferralCode(code: string) {
    const response = await fetch(`${this.apiUrl}/v1/referral/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange referral code: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Extract fingerprint from request headers (if using custom header)
 */
export function getFingerprintFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-fingerprint');
}

/**
 * Extract referral claim from request cookies
 */
export function getReferralClaimFromRequest(request: NextRequest): string | null {
  return request.cookies.get('ref_claim')?.value || null;
}

/**
 * Create a server instance with environment variables
 */
export function createGrowthKitServer(): GrowthKitServer {
  const apiKey = process.env.GROWTHKIT_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROWTHKIT_API_KEY environment variable is required');
  }
  
  return new GrowthKitServer({
    apiKey,
    apiUrl: process.env.GROWTHKIT_API_URL,
  });
}
