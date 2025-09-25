# @fenixblack/growthkit

React SDK for GrowthKit - Intelligent waitlist and referral management system with Next.js middleware support.

## Installation

```bash
npm install @fenixblack/growthkit
# or
yarn add @fenixblack/growthkit
```

## Import Paths

The SDK provides three separate entry points optimized for different environments:

### Main Package (React Components & Hooks)
```tsx
// For React components and hooks (client-side)
import { useGrowthKit, GrowthKitGate, WaitlistForm } from '@fenixblack/growthkit';
```

### Middleware (Edge Runtime Compatible)
```ts
// For Next.js middleware (Edge Runtime)
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';
```

### Server Utilities (Node.js)
```ts
// For server-side utilities (Node.js)
import { GrowthKitServer, createGrowthKitServer } from '@fenixblack/growthkit/server';
```

## Complete Setup (3 Steps)

### 1. Add Middleware (handles referral links & email verification)

Create `middleware.ts` in your Next.js root:

```ts
// middleware.ts
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!,
  referralPath: '/r',  // Handles /r/CODE links
  redirectTo: '/',      // Where to redirect after processing
});

export const config = {
  matcher: ['/r/:code*', '/verify', '/invite/:code*']  // Handles referral, verification, and invitations
};
```

The middleware automatically:
- **Referral links**: `/r/ABC123` → exchanges code for claim token → redirects to `/?ref=token`
- **Email verification**: `/verify?token=xyz` → verifies email → redirects to `/?verified=true`
- **Invitation codes**: `/invite/INV-XXXXXX` → redirects with code → grants invitation credits

### 2. Set Environment Variables

```env
# .env.local
NEXT_PUBLIC_GROWTHKIT_API_KEY=gk_your_api_key_here
NEXT_PUBLIC_GROWTHKIT_API_URL=https://growth.fenixblack.ai/api

# For middleware (server-side)
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

### 3. Use the Hook

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const gk = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY!
  });
  
  // That's it! The hook handles everything
  return <div>Credits: {gk.credits}</div>;
}
```

## Quick Start

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

function App() {
  const gk = useGrowthKit({
    apiKey: 'your-api-key',
    apiUrl: 'https://growth.fenixblack.ai/api', // Optional
  });

  // Handle email verification redirects from middleware
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('verified') === 'true') {
      toast.success('Email verified! +1 credit earned');
      gk.refresh(); // Refresh credits
      window.history.replaceState({}, '', '/');
    } else if (params.get('verified') === 'false') {
      toast.error('Verification failed');
      window.history.replaceState({}, '', '/');
    }
  }, [gk]);

  // The hook automatically:
  // 1. Generates a browser fingerprint
  // 2. Checks for referral cookies (if user came from /r/CODE link)
  // 3. Registers the user and applies any referral credits
  // 4. Fetches current credits and usage

  if (gk.loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Credits: {gk.credits}</h1>
      <p>Your Referral Link: {gk.getReferralLink()}</p>
      
      {/* Users can perform actions that consume credits */}
      <button 
        onClick={() => gk.completeAction('generate')}
        disabled={!gk.canPerformAction('generate')}
      >
        Generate ({gk.policy?.actions.generate?.creditsRequired || 1} credits)
      </button>

      {/* Users can share to earn more credits */}
      <button onClick={() => gk.share()}>
        Share & Earn Credits
      </button>
    </div>
  );
}
```

## Hook Properties

The `useGrowthKit` hook returns an object with the following properties:

```typescript
{
  // User State
  credits: number;              // Current credit balance
  usage: number;                // Total credits used
  name: string | null;          // User's claimed name
  email: string | null;         // User's claimed email
  hasClaimedName: boolean;      // Whether user has claimed a name
  hasClaimedEmail: boolean;     // Whether user has claimed an email
  hasVerifiedEmail: boolean;    // Whether email is verified
  
  // Referral System
  referralCode: string | null;  // User's unique referral code
  getReferralLink: () => string; // Get shareable referral link
  share: (options?) => void;    // Share referral link
  
  // Actions
  completeAction: (action: string, options?) => Promise<boolean>;
  canPerformAction: (action: string) => boolean;
  claimName: (name: string) => Promise<boolean>;
  claimEmail: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  
  // App State
  loading: boolean;             // Initial loading state
  initialized: boolean;         // Whether SDK is initialized
  error: Error | null;          // Any error that occurred
  policy: GrowthKitPolicy;      // App credit policy
  refresh: () => Promise<void>; // Refresh user data
}
```

## Components

### GrowthKitGate
Protect content behind waitlist or paywall:

```tsx
import { GrowthKitGate } from '@fenixblack/growthkit';

<GrowthKitGate config={{ apiKey: 'your-api-key' }}>
  {/* Protected content */}
  <YourApp />
</GrowthKitGate>
```

### GrowthKitAccountWidget
All-in-one account widget with credit display and profile management:

```tsx
import { GrowthKitAccountWidget } from '@fenixblack/growthkit';

<GrowthKitAccountWidget 
  config={{ apiKey: 'your-api-key' }}
  position="top-right"
  showName={true}
  showEmail={true}
  theme="auto"
>
  <YourApp />
</GrowthKitAccountWidget>
```

Features:
- Displays current credit balance
- Shows user's name and email (when claimed)
- Email verification status badge
- Earn credits modal integration
- Automatic flow management
- Customizable position and theme

### WaitlistForm
Customizable waitlist signup:

```tsx
import { WaitlistForm } from '@fenixblack/growthkit';

<WaitlistForm
  growthKit={gk}
  message="Join our exclusive beta"
  onSuccess={(position) => console.log(`Position: ${position}`)}
/>
```

## Server-Side Usage

```ts
import { createGrowthKitServer } from '@fenixblack/growthkit/server';

const gk = createGrowthKitServer();

// Get user data
const user = await gk.getUser('fingerprint-123');

// Track actions
await gk.completeAction('fingerprint-123', 'generate');

// Add to waitlist
await gk.addToWaitlist('user@example.com', 'fingerprint-123');
```

## Architecture Benefits

This SDK follows modern best practices:

1. **Separate Entry Points**: Different builds for different environments (React, Edge Runtime, Node.js)
2. **Tree Shaking**: Import only what you need
3. **Type Safety**: Full TypeScript support with proper types for each environment
4. **Performance**: Optimized bundles for each runtime
5. **Developer Experience**: Clear import paths that indicate where code runs

## License

MIT