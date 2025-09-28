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
    
    // Handle API proxy requests
    if (pathname.startsWith('/api/growthkit/')) {
      const apiPath = pathname.replace('/api/growthkit', '');
      
      if (config.debug) {
        console.log('[GrowthKit] Proxying API request to:', apiPath);
      }

      try {
        // Build the target URL
        const targetUrl = `${config.apiUrl}${apiPath}`;
        
        // Prepare headers for the proxied request
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        };

        // Forward specific headers from the original request
        const forwardHeaders = ['X-Fingerprint', 'User-Agent', 'Accept-Language'];
        forwardHeaders.forEach(headerName => {
          const value = request.headers.get(headerName);
          if (value) {
            headers[headerName] = value;
          }
        });

        // Prepare the request body
        let body: string | undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          body = await request.text();
        }

        // Make the proxied request
        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body,
        });

        // Get the response data
        const data = await response.text();
        
        if (config.debug) {
          console.log('[GrowthKit] Proxy response status:', response.status);
        }

        // Create the response with the same status and headers
        const proxyResponse = NextResponse.next();
        
        // Clear the response and set new content
        const finalResponse = new NextResponse(data, {
          status: response.status,
          statusText: response.statusText,
        });

        // Forward relevant response headers
        const responseHeaders = ['Content-Type'];
        responseHeaders.forEach(headerName => {
          const value = response.headers.get(headerName);
          if (value) {
            finalResponse.headers.set(headerName, value);
          }
        });

        // Add CORS headers for browser requests
        finalResponse.headers.set('Access-Control-Allow-Origin', '*');
        finalResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        finalResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Fingerprint');

        return finalResponse;

      } catch (error) {
        if (config.debug) {
          console.error('[GrowthKit] Proxy error:', error);
        }
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Proxy request failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Handle email verification
    if (pathname === '/verify') {
      const token = request.nextUrl.searchParams.get('token');
      
      if (!token) {
        if (config.debug) {
          console.warn('[GrowthKit] Missing verification token');
        }
        const redirectUrl = new URL(redirectTo, request.url);
        redirectUrl.searchParams.set('verified', 'false');
        redirectUrl.searchParams.set('error', 'missing-token');
        return NextResponse.redirect(redirectUrl);
      }
      
      if (config.debug) {
        console.log('[GrowthKit] Processing email verification with token');
      }
      
      try {
        // Verify the email token via GrowthKit API (using email + token mode)
        const verifyResponse = await fetch(`${config.apiUrl}/v1/verify/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({ 
            token
          }),
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