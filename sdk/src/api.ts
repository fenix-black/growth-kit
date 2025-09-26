import type {
  APIResponse,
  MeResponse,
  CompleteResponse,
  ClaimResponse,
  VerifyResponse,
  WaitlistResponse,
} from './types';

export class GrowthKitAPI {
  private apiKey: string;
  private apiUrl: string;
  private fingerprint: string | null = null;

  constructor(apiKey: string, apiUrl: string = '') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || this.detectApiUrl();
  }

  private detectApiUrl(): string {
    // Auto-detect based on current environment
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
      }
    }
    // Default to production URL (update this when deployed)
    return 'https://growth.fenixblack.ai/api';
  }

  setFingerprint(fingerprint: string) {
    this.fingerprint = fingerprint;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.apiUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(this.fingerprint && { 'X-Fingerprint': this.fingerprint }),
          ...options.headers,
        },
        credentials: 'include', // For cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMe(fingerprint: string, claim?: string): Promise<APIResponse<MeResponse>> {
    return this.request<MeResponse>('/v1/me', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint,
        ...(claim && { claim })
      }),
    });
  }

  async completeAction(
    fingerprint: string,
    action: string = 'default',
    creditsRequired?: number,
    usdValue?: number,
    metadata?: any
  ): Promise<APIResponse<CompleteResponse>> {
    return this.request<CompleteResponse>('/v1/complete', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        action,
        ...(creditsRequired !== undefined && { creditsRequired }),
        ...(usdValue !== undefined && { usdValue }),
        metadata,
      }),
    });
  }

  async claimName(
    fingerprint: string,
    name: string
  ): Promise<APIResponse<ClaimResponse>> {
    return this.request<ClaimResponse>('/v1/claim/name', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        name,
      }),
    });
  }

  async claimEmail(
    fingerprint: string,
    email: string
  ): Promise<APIResponse<ClaimResponse>> {
    return this.request<ClaimResponse>('/v1/claim/email', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        email,
      }),
    });
  }

  async verifyEmail(
    fingerprint: string,
    token: string
  ): Promise<APIResponse<VerifyResponse>> {
    return this.request<VerifyResponse>('/v1/verify/email', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        token,
      }),
    });
  }

  async joinWaitlist(
    email: string,
    fingerprint?: string,
    metadata?: any
  ): Promise<APIResponse<WaitlistResponse>> {
    return this.request<WaitlistResponse>('/v1/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email,
        fingerprint,
        metadata,
      }),
    });
  }

  async trackReferralVisit(claim?: string): Promise<APIResponse<any>> {
    return this.request('/v1/referral/visit', {
      method: 'POST',
      body: JSON.stringify({ claim }),
    });
  }

  async trackEvents(events: Array<{
    eventName: string;
    properties?: Record<string, any>;
    timestamp: number;
  }>, context?: any, sessionId?: string): Promise<APIResponse<{ tracked: boolean }>> {
    return this.request('/v1/track', {
      method: 'POST',
      body: JSON.stringify({ events, context, sessionId }),
    });
  }
}
