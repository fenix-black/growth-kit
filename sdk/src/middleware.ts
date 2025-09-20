import type { NextRequest, NextFetchEvent } from 'next/server';
import { NextResponse } from 'next/server';

export interface GrowthKitMiddlewareConfig {
  /**
   * Your GrowthKit API key
   */
  apiKey: string;
  
  /**
   * The GrowthKit API URL
   * @example "https://growthkit.example.com/api"
   */
  apiUrl: string;
  
  /**
   * The referral path prefix (default: "/r")
   * @example "/refer" would match /refer/ABC123
   */
  referralPath?: string;
  
  /**
   * Where to redirect after processing the referral (default: "/")
   * @example "/welcome" or "/app"
   */
  redirectTo?: string;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Create a Next.js middleware handler for GrowthKit referral links
 * 
 * This middleware intercepts referral links, validates them with the GrowthKit
 * server, and passes the claim token to your app via URL parameters.
 * 
 * @example
 * ```ts
 * // middleware.ts
 * import { createGrowthKitMiddleware } from '@fenixblack/growthkit';
 * 
 * export const middleware = createGrowthKitMiddleware({
 *   apiKey: process.env.GROWTHKIT_API_KEY!,
 *   apiUrl: process.env.GROWTHKIT_API_URL!
 * });
 * 
 * export const config = {
 *   matcher: '/r/:code*'
 * };
 * ```
 */
export function createGrowthKitMiddleware(config: GrowthKitMiddlewareConfig) {
  const referralPath = config.referralPath || '/r';
  const redirectTo = config.redirectTo || '/';
  
  return async function growthKitMiddleware(
    request: NextRequest,
    event?: NextFetchEvent
  ): Promise<NextResponse | Response | null | undefined> {
    const pathname = request.nextUrl.pathname;
    
    // Check if this is a referral link
    if (!pathname.startsWith(referralPath + '/')) {
      return NextResponse.next();
    }
    
    // Extract referral code
    const code = pathname.slice(referralPath.length + 1).split('/')[0];
    
    if (!code) {
      if (config.debug) {
        console.warn('[GrowthKit] No referral code found in path:', pathname);
      }
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    
    if (config.debug) {
      console.log('[GrowthKit] Processing referral code:', code);
    }
    
    try {
      // Exchange the referral code for a claim token via GrowthKit API
      const exchangeResponse = await fetch(`${config.apiUrl}/v1/referral/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ code }),
      });
      
      if (!exchangeResponse.ok) {
        if (config.debug) {
          console.error('[GrowthKit] Failed to exchange referral code:', exchangeResponse.status);
        }
        // Invalid code, redirect without claim
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      
      const data = await exchangeResponse.json();
      const claimToken = data.data?.claim;
      
      if (!claimToken) {
        if (config.debug) {
          console.error('[GrowthKit] No claim token received from exchange');
        }
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      
      // Redirect to app with claim token as URL parameter
      // The useGrowthKit hook will detect this and process it
      const redirectUrl = new URL(redirectTo, request.url);
      redirectUrl.searchParams.set('ref', claimToken);
      
      if (config.debug) {
        console.log('[GrowthKit] Redirecting with claim token to:', redirectUrl.toString());
      }
      
      return NextResponse.redirect(redirectUrl);
      
    } catch (error) {
      if (config.debug) {
        console.error('[GrowthKit] Error processing referral:', error);
      }
      // On error, redirect without claim
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  };
}

/**
 * Standalone middleware function for simple use cases
 * Requires GROWTHKIT_API_KEY and GROWTHKIT_API_URL environment variables
 * 
 * @example
 * ```ts
 * // middleware.ts
 * export { growthKitMiddleware as middleware } from '@fenixblack/growthkit';
 * 
 * export const config = {
 *   matcher: '/r/:code*'
 * };
 * ```
 */
export async function growthKitMiddleware(
  request: NextRequest,
  event?: NextFetchEvent
): Promise<NextResponse | Response | null | undefined> {
  const apiKey = process.env.GROWTHKIT_API_KEY;
  const apiUrl = process.env.GROWTHKIT_API_URL;
  
  if (!apiKey || !apiUrl) {
    console.error('[GrowthKit] GROWTHKIT_API_KEY and GROWTHKIT_API_URL environment variables are required');
    return NextResponse.next();
  }
  
  const handler = createGrowthKitMiddleware({
    apiKey,
    apiUrl,
    debug: process.env.NODE_ENV === 'development'
  });
  
  return handler(request, event);
}