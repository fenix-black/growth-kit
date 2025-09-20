/**
 * Example: Integrating GrowthKit SDK in a Next.js App
 * 
 * This example shows how to use the GrowthKit SDK in a real application
 * with proper error handling, loading states, and UI components.
 */

import React, { useState } from 'react';
import { useGrowthKit } from '@fenixblack/growthkit';

// Example: Main app component with GrowthKit integration
export function AppWithGrowthKit() {
  const gk = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY!,
    apiUrl: process.env.NEXT_PUBLIC_GROWTHKIT_API_URL,
    debug: process.env.NODE_ENV === 'development',
  });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle content generation (example action)
  const handleGenerate = async () => {
    if (!gk.canPerformAction('generate')) {
      alert('Not enough credits!');
      return;
    }

    setIsGenerating(true);
    try {
      const success = await gk.completeAction('generate', {
        timestamp: Date.now(),
        // Add any metadata you want to track
      });

      if (success) {
        // Your generation logic here
        console.log('Generation successful!');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading state
  if (gk.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Initializing GrowthKit...</div>
      </div>
    );
  }

  // Show error state
  if (gk.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">
          Error: {gk.error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Credits Display */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Credits: {gk.credits}</h2>
            <p className="text-gray-600">Usage: {gk.usage} actions</p>
          </div>
          <button
            onClick={() => gk.share()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Share & Earn Credits
          </button>
        </div>
      </div>

      {/* Main Action */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Generate Content</h3>
        <button
          onClick={handleGenerate}
          disabled={!gk.canPerformAction('generate') || isGenerating}
          className={`w-full py-3 px-6 rounded font-medium ${
            gk.canPerformAction('generate')
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? 'Generating...' : `Generate (${gk.policy?.actions.generate?.creditsRequired || 1} credits)`}
        </button>
      </div>

      {/* Claim Rewards */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Earn Free Credits</h3>
        
        {/* Name Claim */}
        {!gk.hasClaimedName && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter your name (+2 credits)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim()) {
                  gk.claimName(name.trim());
                }
              }}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}

        {/* Email Claim */}
        {!gk.hasClaimedEmail && (
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email (+2 credits)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email.trim()) {
                  gk.claimEmail(email.trim());
                }
              }}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}

        {/* Referral Link */}
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-2">Your Referral Link:</p>
          <div className="flex">
            <input
              type="text"
              value={gk.getReferralLink()}
              readOnly
              className="flex-1 px-3 py-2 border rounded-l bg-white"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(gk.getReferralLink());
                alert('Copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Earn {gk.policy?.referralCredits || 5} credits for each friend who joins!
          </p>
        </div>
      </div>

      {/* Soft Paywall */}
      {gk.shouldShowSoftPaywall() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You're out of credits! Share your referral link to earn more:
              </p>
              <p className="mt-2 text-sm text-yellow-700 font-mono">
                {gk.getReferralLink()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist */}
      {!gk.isOnWaitlist && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Join Waitlist for Premium</h3>
          <button
            onClick={() => {
              const email = prompt('Enter your email to join the waitlist:');
              if (email) {
                gk.joinWaitlist(email, { source: 'app' });
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Join Waitlist
          </button>
        </div>
      )}

      {gk.isOnWaitlist && gk.waitlistPosition && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-green-700">
            You're #{gk.waitlistPosition} on the waitlist!
          </p>
        </div>
      )}
    </div>
  );
}

// Example: Middleware for handling referral links (pages/_middleware.ts or app/middleware.ts)
export const referralMiddleware = `
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle /r/:code referral links
  if (request.nextUrl.pathname.startsWith('/r/')) {
    const code = request.nextUrl.pathname.split('/')[2];
    
    if (code) {
      // Redirect to GrowthKit service to set cookie
      const growthKitUrl = new URL(\`\${process.env.GROWTHKIT_SERVICE_URL}/r/\${code}\`);
      return NextResponse.redirect(growthKitUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/r/:code*',
};
`;

// Example: Environment variables (.env.local)
export const envExample = `
# GrowthKit Configuration
NEXT_PUBLIC_GROWTHKIT_API_KEY=gk_your_api_key_here
NEXT_PUBLIC_GROWTHKIT_API_URL=http://localhost:3000/api
GROWTHKIT_SERVICE_URL=http://localhost:3000
`;
