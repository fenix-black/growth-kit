import type {
  APIResponse,
  MeResponse,
  CompleteResponse,
  ClaimResponse,
  VerifyResponse,
  WaitlistResponse,
} from './types';

export class GrowthKitAPI {
  private apiKey: string | null;
  private publicKey: string | null;
  private apiUrl: string;
  private fingerprint: string | null = null;
  private isProxyMode: boolean;
  private isPublicMode: boolean;
  private debug: boolean = false;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(apiKey?: string, publicKey?: string, apiUrl: string = '', debug: boolean = false) {
    // Determine mode: proxy (default), public key, or private API key
    this.isPublicMode = !!publicKey;
    this.isProxyMode = !apiKey && !publicKey;
    this.apiKey = apiKey || null;
    this.publicKey = publicKey || null;
    this.apiUrl = this.isProxyMode ? this.detectProxyUrl() : (apiUrl || this.detectApiUrl());
    this.debug = debug;
    
    if (this.isProxyMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[GrowthKit] Using secure proxy mode via middleware - API key is handled server-side');
    } else if (this.isPublicMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[GrowthKit] Using public key mode - secure for client-side usage');
    } else if (!this.isProxyMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('[GrowthKit] Using direct API mode with client-side API key. Consider upgrading to proxy mode or public key mode for better security.');
    }
  }

  private detectApiUrl(): string {
    // Auto-detect based on current environment for direct API mode
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
      }
    }
    // Default to production URL (update this when deployed)
    return 'https://growth.fenixblack.ai/api';
  }

  private detectProxyUrl(): string {
    // For proxy mode, use local middleware proxy routes
    // The middleware automatically handles /api/growthkit/* routes
    if (typeof window !== 'undefined') {
      const { protocol, host } = window.location;
      return `${protocol}//${host}/api/growthkit`;
    }
    // Fallback for SSR
    return '/api/growthkit';
  }

  setFingerprint(fingerprint: string) {
    this.fingerprint = fingerprint;
  }

  private isTokenValid(): boolean {
    return !!(this.token && this.tokenExpiry && this.tokenExpiry > new Date());
  }

  private async getStoredToken(): Promise<{token: string; expiry: Date} | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('growthkit_token');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      const expiry = new Date(parsed.expiresAt);
      
      if (expiry > new Date()) {
        return { token: parsed.token, expiry };
      } else {
        localStorage.removeItem('growthkit_token');
        return null;
      }
    } catch {
      localStorage.removeItem('growthkit_token');
      return null;
    }
  }

  private storeToken(token: string, expiresAt: string) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('growthkit_token', JSON.stringify({
        token,
        expiresAt
      }));
    } catch (error) {
      if (this.debug) {
        console.warn('[GrowthKit] Failed to store token:', error);
      }
    }
  }

  private async requestToken(): Promise<boolean> {
    if (!this.isPublicMode || !this.publicKey || !this.fingerprint) {
      return false;
    }

    try {
      const url = `${this.apiUrl}/public/auth/token`;
      
      if (this.debug) {
        console.log('[GrowthKit] Requesting new token...');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: this.publicKey,
          fingerprint: this.fingerprint,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      const tokenData = data.data || data;
      
      this.token = tokenData.token;
      this.tokenExpiry = new Date(tokenData.expiresAt);
      this.storeToken(tokenData.token, tokenData.expiresAt);
      
      if (this.debug) {
        console.log('[GrowthKit] Token obtained successfully');
      }
      
      return true;
    } catch (error) {
      if (this.debug) {
        console.error('[GrowthKit] Token request failed:', error);
      }
      return false;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    if (!this.isPublicMode) return true;
    
    // Check current token
    if (this.isTokenValid()) return true;
    
    // Try to load from storage
    const stored = await this.getStoredToken();
    if (stored) {
      this.token = stored.token;
      this.tokenExpiry = stored.expiry;
      return true;
    }
    
    // Request new token
    return await this.requestToken();
  }

  private transformEndpointForPublic(endpoint: string): string {
    // Map existing endpoints to new public endpoints
    const endpointMap: Record<string, string> = {
      '/v1/me': '/public/user',
      '/v1/track': '/public/track',
      '/v1/waitlist': '/public/waitlist/join',
      '/v1/referral/visit': '/public/referral/check',
      // Keep other endpoints as-is for now (may need mapping later)
    };

    return endpointMap[endpoint] || endpoint;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    // For public mode, ensure we have a valid token
    if (this.isPublicMode) {
      const hasToken = await this.ensureValidToken();
      if (!hasToken) {
        return {
          success: false,
          error: 'Failed to obtain authentication token',
        };
      }
    }

    // Transform endpoint for public mode
    const finalEndpoint = this.isPublicMode ? this.transformEndpointForPublic(endpoint) : endpoint;
    const url = `${this.apiUrl}${finalEndpoint}`;
    
    if (this.debug) {
      console.log('[GrowthKit API] Request starting:', {
        endpoint,
        finalEndpoint,
        url,
        method: options.method || 'GET',
        hasBody: !!options.body,
        bodyLength: options.body ? String(options.body).length : 0,
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(this.fingerprint && !this.isPublicMode && { 'X-Fingerprint': this.fingerprint }),
      };

      // Safely merge additional headers
      if (options.headers) {
        const additionalHeaders = options.headers as Record<string, string>;
        Object.assign(headers, additionalHeaders);
      }

      // Add Authorization header based on mode
      if (this.isPublicMode && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (!this.isProxyMode && this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      if (this.debug) {
        console.log('[GrowthKit API] Request headers:', {
          ...headers,
          Authorization: headers.Authorization ? 'Bearer [REDACTED]' : undefined
        });
      }

      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // For cookies
      });
      const responseTime = Date.now() - startTime;

      if (this.debug) {
        console.log('[GrowthKit API] Response received:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        });
      }

      const data = await response.json();

      if (!response.ok) {
        if (this.debug) {
          console.error('[GrowthKit API] Request failed with error response:', {
            endpoint,
            finalEndpoint,
            status: response.status,
            statusText: response.statusText,
            errorData: data,
            timestamp: new Date().toISOString()
          });
          
          // Special handling for common deployment issues
          if (response.status === 405) {
            console.error('[GrowthKit] 405 Method Not Allowed - This usually means the server needs to be redeployed with the latest code');
          }
        }
        throw new Error(data.message || data.error || `Request failed (${response.status})`);
      }

      if (this.debug) {
        console.log('[GrowthKit API] Request successful:', {
          endpoint,
          hasData: !!data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[GrowthKit API] Request failed with exception:', {
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMe(fingerprint: string, claim?: string): Promise<APIResponse<MeResponse>> {
    // In public mode, we don't need to send fingerprint (it's in the token)
    // But we still need to send it for other modes
    const bodyData = this.isPublicMode 
      ? { ...(claim && { claim }) }  // Only send claim if present
      : { fingerprint, ...(claim && { claim }) }; // Send fingerprint for other modes

    return this.request<MeResponse>('/v1/me', {
      method: 'POST',
      body: JSON.stringify(bodyData),
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
