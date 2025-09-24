// This file is Edge Runtime compatible - no React imports
import type { NextRequest, NextFetchEvent } from 'next/server';

// We need to use dynamic imports to avoid importing Next.js at module evaluation time
let NextResponse: any;

export interface GrowthKitMiddlewareConfig {
  apiKey: string;
  apiUrl: string;
  referralPath?: string;
  redirectTo?: string;
  debug?: boolean;
}

export function createGrowthKitMiddleware(config: GrowthKitMiddlewareConfig) {
  const referralPath = config.referralPath || '/r';
  const redirectTo = config.redirectTo || '/';
  
  return async function growthKitMiddleware(
    request: NextRequest,
    event?: NextFetchEvent
  ): Promise<any> {
    // Dynamically import NextResponse to avoid module evaluation issues
    if (!NextResponse) {
      const nextServer = await import('next/server');
      NextResponse = nextServer.NextResponse;
    }
    
    const pathname = request.nextUrl.pathname;
    
    // Handle email verification
    if (pathname === '/verify') {
      const token = request.nextUrl.searchParams.get('token');
      
      if (!token) {
        if (config.debug) {
          console.warn('[GrowthKit] No verification token found');
        }
        const redirectUrl = new URL(redirectTo, request.url);
        redirectUrl.searchParams.set('verified', 'false');
        redirectUrl.searchParams.set('error', 'missing-token');
        return NextResponse.redirect(redirectUrl);
      }
      
      if (config.debug) {
        console.log('[GrowthKit] Processing verification token');
      }
      
      try {
        // Verify the email token via GrowthKit API
        const verifyResponse = await fetch(`${config.apiUrl}/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({ token }),
        });
        
        const redirectUrl = new URL(redirectTo, request.url);
        
        if (verifyResponse.ok) {
          if (config.debug) {
            console.log('[GrowthKit] Email verified successfully');
          }
          redirectUrl.searchParams.set('verified', 'true');
        } else {
          if (config.debug) {
            console.error('[GrowthKit] Email verification failed:', verifyResponse.status);
          }
          redirectUrl.searchParams.set('verified', 'false');
        }
        
        return NextResponse.redirect(redirectUrl);
        
      } catch (error) {
        if (config.debug) {
          console.error('[GrowthKit] Error verifying email:', error);
        }
        const redirectUrl = new URL(redirectTo, request.url);
        redirectUrl.searchParams.set('verified', 'false');
        redirectUrl.searchParams.set('error', 'verification-failed');
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Check if this is an invitation link
    if (pathname.startsWith('/invite/')) {
      const inviteCode = pathname.slice('/invite/'.length).split('/')[0];
      
      if (!inviteCode) {
        if (config.debug) {
          console.warn('[GrowthKit] No invitation code found in path:', pathname);
        }
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      
      if (config.debug) {
        console.log('[GrowthKit] Processing invitation code:', inviteCode);
      }
      
      // Redirect with invitation code as ref parameter (same as referral flow)
      const redirectUrl = new URL(redirectTo, request.url);
      redirectUrl.searchParams.set('ref', inviteCode);
      
      if (config.debug) {
        console.log('[GrowthKit] Redirecting with invitation code to:', redirectUrl.toString());
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
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
        body: JSON.stringify({ referralCode: code }),
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

export async function growthKitMiddleware(
  request: NextRequest,
  event?: NextFetchEvent
): Promise<any> {
  const apiKey = process.env.GROWTHKIT_API_KEY;
  const apiUrl = process.env.GROWTHKIT_API_URL;
  
  if (!apiKey || !apiUrl) {
    console.error('[GrowthKit] GROWTHKIT_API_KEY and GROWTHKIT_API_URL environment variables are required');
    if (!NextResponse) {
      const nextServer = await import('next/server');
      NextResponse = nextServer.NextResponse;
    }
    return NextResponse.next();
  }
  
  const handler = createGrowthKitMiddleware({
    apiKey,
    apiUrl,
    debug: process.env.NODE_ENV === 'development'
  });
  
  return handler(request, event);
}