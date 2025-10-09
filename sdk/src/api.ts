import type {
  APIResponse,
  MeResponse,
  CompleteResponse,
  ClaimResponse,
  VerifyResponse,
  WaitlistResponse,
} from './types';
import { getBrowserContext } from './context';

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
  private tokenRetryCount = 0;
  private tokenRetryTimeout: NodeJS.Timeout | null = null;
  private retryingRequest: boolean = false;
  private language: 'en' | 'es' = 'en'; // Widget language preference

  constructor(apiKey?: string, publicKey?: string, apiUrl: string = '', debug: boolean = false, language?: 'en' | 'es') {
    this.language = language || 'en';
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
    } else if (!this.isProxyMode && !this.isPublicMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('[GrowthKit] Using direct API mode with client-side API key. Consider upgrading to proxy mode or public key mode for better security.');
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.tokenRetryTimeout) {
      clearTimeout(this.tokenRetryTimeout);
      this.tokenRetryTimeout = null;
    }
  }

  private detectApiUrl(): string {
    // In public key mode, always default to production URL
    // Users can override via apiUrl parameter if needed
    if (this.isPublicMode) {
      return 'https://growth.fenixblack.ai/api';
    }
    
    // For direct API mode only, detect localhost for development
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
      }
    }
    
    // Default to production URL
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

  setLanguage(language: 'en' | 'es') {
    this.language = language;
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

  private async requestTokenWithRetry(): Promise<boolean> {
    if (!this.isPublicMode || !this.publicKey || !this.fingerprint) {
      return false;
    }

    const attempt = async (): Promise<boolean> => {
      try {
        const url = `${this.apiUrl}/public/auth/token`;
        
        if (this.debug) {
          console.log(`[GrowthKit] Requesting token (attempt ${this.tokenRetryCount + 1})...`);
        }

        // Get browser context to send with token request
        const context = getBrowserContext();

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicKey: this.publicKey,
            fingerprint: this.fingerprint,
            context,
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
        this.tokenRetryCount = 0; // Reset retry count on success
        
        if (this.debug) {
          console.log('[GrowthKit] Token obtained successfully');
        }
        
        // Schedule proactive refresh at 80% of token lifetime
        this.scheduleTokenRefresh();
        
        return true;
      } catch (error) {
        if (this.debug) {
          console.error(`[GrowthKit] Token request failed (attempt ${this.tokenRetryCount + 1}):`, error);
        }
        
        // Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
        const delay = Math.min(1000 * Math.pow(2, this.tokenRetryCount), 30000);
        this.tokenRetryCount++;
        
        if (this.debug) {
          console.log(`[GrowthKit] Retrying token request in ${delay}ms...`);
        }
        
        // Clear any existing timeout
        if (this.tokenRetryTimeout) {
          clearTimeout(this.tokenRetryTimeout);
        }
        
        // Schedule retry with exponential backoff
        return new Promise((resolve) => {
          this.tokenRetryTimeout = setTimeout(() => {
            attempt().then(resolve);
          }, delay);
        });
      }
    };
    
    return attempt();
  }

  private scheduleTokenRefresh(): void {
    if (!this.tokenExpiry || !this.isPublicMode) return;
    
    const now = new Date();
    const timeUntilExpiry = this.tokenExpiry.getTime() - now.getTime();
    const refreshTime = timeUntilExpiry * 0.8; // Refresh at 80% of lifetime
    
    if (refreshTime > 0) {
      setTimeout(() => {
        if (this.debug) {
          console.log('[GrowthKit] Proactively refreshing token...');
        }
        this.requestTokenWithRetry();
      }, refreshTime);
    }
  }

  private async requestToken(): Promise<boolean> {
    return this.requestTokenWithRetry();
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
      
      // Schedule proactive refresh for restored token
      this.scheduleTokenRefresh();
      return true;
    }
    
    // Request new token with retry logic
    return await this.requestTokenWithRetry();
  }

  private transformEndpointForPublic(endpoint: string): string {
    // Map existing endpoints to new public endpoints
    const endpointMap: Record<string, string> = {
      '/v1/me': '/public/user',
      '/v1/track': '/public/track',
      '/v1/complete': '/public/complete',
      '/v1/waitlist': '/public/waitlist/join',
      '/v1/referral/visit': '/public/referral/check',
      '/v1/referral/check': '/public/referral/check',
      '/v1/invitation/redeem': '/public/invitation/redeem',
      '/v1/verify/email': '/public/verify/email',
      '/v1/claim/name': '/public/claim/name',
      '/v1/claim/email': '/public/claim/email',
      // Keep other endpoints as-is for now (may need mapping later)
    };

    return endpointMap[endpoint] || endpoint;
  }

  private async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestInit = {},
    maxAttempts: number = 1
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.request(endpoint, options);
        
        // If successful, return immediately
        if (response.success) {
          return response;
        }
        
        // If it's a business logic error (not network), don't retry
        if (response.error && !this.isNetworkError(response.error)) {
          return response;
        }
        
        lastError = new Error(response.error || 'Unknown error');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (this.debug) {
          console.warn(`[GrowthKit] Request attempt ${attempt}/${maxAttempts} failed:`, lastError.message);
        }
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 1000 : 2000; // 1s, then 2s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed, return temporarily unavailable
    return {
      success: false,
      error: 'temporarily_unavailable',
    };
  }
  
  private isNetworkError(errorMessage: string): boolean {
    const networkErrorPatterns = [
      'Failed to fetch',
      'Network request failed',
      'fetch is not defined',
      'Failed to obtain authentication token',
      'Token request failed',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];
    
    return networkErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
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
        // Handle 401 Unauthorized in public mode - token might be invalid
        if (response.status === 401 && this.isPublicMode && !this.retryingRequest) {
          if (this.debug) {
            console.log('[GrowthKit] 401 Unauthorized - Token may be invalid, clearing and retrying...');
          }
          
          // Clear invalid token
          this.token = null;
          this.tokenExpiry = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('growthkit_token');
          }
          
          // Set retry flag to prevent infinite loops
          this.retryingRequest = true;
          
          // Retry once with a fresh token
          const hasNewToken = await this.ensureValidToken();
          if (hasNewToken) {
            if (this.debug) {
              console.log('[GrowthKit] Retrying request with new token...');
            }
            // Recursive retry - original options will pick up the new token
            const result = await this.request(endpoint, options);
            this.retryingRequest = false; // Reset flag after retry
            return result;
          }
          
          this.retryingRequest = false; // Reset flag if retry failed
        }
        
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
    // Get browser context for better tracking
    const context = getBrowserContext();
    
    // Override widgetLanguage with the configured language
    const contextWithLanguage = {
      ...context,
      widgetLanguage: this.language,
    };
    
    // In public mode, we don't need to send fingerprint (it's in the token)
    // But we still need to send it for other modes
    const bodyData = this.isPublicMode 
      ? { ...(claim && { claim }), context: contextWithLanguage }  // Send claim and context
      : { fingerprint, ...(claim && { claim }), context: contextWithLanguage }; // Send fingerprint, claim, and context

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
    // In public mode, fingerprint is in the JWT token, not the body
    const bodyData = this.isPublicMode 
      ? {
          action,
          ...(creditsRequired !== undefined && { creditsRequired }),
          ...(usdValue !== undefined && { usdValue }),
          ...(metadata && { metadata }),
        }
      : {
          fingerprint,
          action,
          ...(creditsRequired !== undefined && { creditsRequired }),
          ...(usdValue !== undefined && { usdValue }),
          metadata,
        };

    // Credit-consuming actions get 3 attempts with retry logic
    return this.requestWithRetry<CompleteResponse>('/v1/complete', {
      method: 'POST',
      body: JSON.stringify(bodyData),
    }, 3);
  }

  async claimName(
    fingerprint: string,
    name: string
  ): Promise<APIResponse<ClaimResponse>> {
    // Name claiming is a credit-earning action, use retry logic
    return this.requestWithRetry<ClaimResponse>('/v1/claim/name', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        name,
      }),
    }, 3);
  }

  async claimEmail(
    fingerprint: string,
    email: string
  ): Promise<APIResponse<ClaimResponse>> {
    // Email claiming is a credit-earning action, use retry logic
    return this.requestWithRetry<ClaimResponse>('/v1/claim/email', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        email,
      }),
    }, 3);
  }

  async verifyEmail(
    fingerprint: string,
    token: string
  ): Promise<APIResponse<VerifyResponse>> {
    // Email verification is a credit-earning action, use retry logic
    return this.requestWithRetry<VerifyResponse>('/v1/verify/email', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        token,
      }),
    }, 3);
  }

  async joinWaitlist(
    email: string,
    fingerprint?: string,
    metadata?: any,
    productTag?: string
  ): Promise<APIResponse<WaitlistResponse>> {
    return this.request<WaitlistResponse>('/v1/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email,
        fingerprint,
        metadata,
        productTag,
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

  async checkReferral(
    fingerprint: string,
    referralCode: string
  ): Promise<APIResponse<any>> {
    return this.request('/v1/referral/check', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        referralCode,
      }),
    });
  }

  async redeemInvitation(
    fingerprint: string,
    invitationCode: string
  ): Promise<APIResponse<any>> {
    return this.request('/v1/invitation/redeem', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        invitationCode,
      }),
    });
  }
}
