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

### 1. Add Middleware (handles referral links)

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
  matcher: '/r/:code*'
};
```

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

function App() {
  const gk = useGrowthKit({
    apiKey: 'your-api-key',
    apiUrl: 'https://growth.fenixblack.ai/api', // Optional
  });

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