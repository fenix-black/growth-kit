# @fenixblack/growthkit

React SDK for GrowthKit - Intelligent waitlist and referral management system with Next.js middleware support.

## Installation

```bash
npm install @fenixblack/growthkit
# or
yarn add @fenixblack/growthkit
```

## Complete Setup (3 Steps)

### 1. Add Middleware (handles referral links)

Create `middleware.ts` in your Next.js root:

```ts
// middleware.ts
export { growthKitMiddleware as middleware } from '@fenixblack/growthkit';

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
        Share & Earn {gk.policy?.referralCredits || 5} Credits
      </button>

      {/* One-time rewards for data capture */}
      {!gk.hasClaimedName && (
        <input 
          placeholder="Enter your name for 2 free credits"
          onBlur={(e) => gk.claimName(e.target.value)}
        />
      )}

      {/* Smart paywall when out of credits */}
      {gk.shouldShowSoftPaywall() && (
        <div>
          <p>Out of credits! Share to earn more:</p>
          <p>{gk.getReferralLink()}</p>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### useGrowthKit(config)

The main React hook for integrating GrowthKit.

#### Config Options

- `apiKey` (required): Your GrowthKit API key
- `apiUrl` (optional): Custom API URL (auto-detected by default)
- `debug` (optional): Enable debug logging

#### Returned State

- `loading`: Boolean indicating if data is being fetched
- `initialized`: Boolean indicating if the SDK is ready
- `error`: Error object if something went wrong
- `fingerprint`: Unique browser fingerprint
- `credits`: Current credit balance
- `usage`: Total actions performed
- `referralCode`: User's referral code
- `policy`: App policy configuration
- `hasClaimedName`: Whether name reward was claimed
- `hasClaimedEmail`: Whether email reward was claimed
- `hasVerifiedEmail`: Whether email was verified
- `isOnWaitlist`: Whether user joined the waitlist
- `waitlistPosition`: Position in waitlist queue

#### Methods

##### completeAction(action?, metadata?)
Complete an action and consume credits.
```ts
await gk.completeAction('generate', { model: 'gpt-4' });
```

##### claimName(name)
Claim one-time credits for providing name.
```ts
const success = await gk.claimName('John Doe');
```

##### claimEmail(email)
Claim one-time credits for providing email.
```ts
const success = await gk.claimEmail('john@example.com');
```

##### verifyEmail(token)
Verify email with token to earn credits.
```ts
const success = await gk.verifyEmail('verification-token');
```

##### joinWaitlist(email, metadata?)
Join the waitlist.
```ts
const success = await gk.joinWaitlist('john@example.com', {
  source: 'landing-page'
});
```

##### share(options?)
Share referral link using native share or clipboard.
```ts
await gk.share({
  title: 'Check out this app!',
  text: 'Get free credits when you join',
});
```

##### getReferralLink()
Get the user's referral link.
```ts
const link = gk.getReferralLink();
// https://app.com/r/ABC123
```

##### shouldShowSoftPaywall()
Check if soft paywall should be displayed.
```ts
if (gk.shouldShowSoftPaywall()) {
  // Show upgrade prompt
}
```

##### canPerformAction(action?)
Check if user has enough credits for an action.
```ts
if (gk.canPerformAction('generate')) {
  // Enable button
}
```

##### refresh()
Manually refresh user data.
```ts
await gk.refresh();
```

## Next.js Middleware Integration

### How Referrals Work

The referral flow is automatic and requires minimal setup:

1. **User A** shares their referral link: `https://yourapp.com/r/ABC123`
2. **User B** clicks the link
3. **Your middleware** intercepts and validates with GrowthKit API
4. **Middleware** redirects to your app with claim token in URL: `/?ref=CLAIM_TOKEN`
5. **Your app** loads and the `useGrowthKit` hook automatically:
   - Generates User B's fingerprint
   - Sends fingerprint + claim to `/v1/me` endpoint
   - GrowthKit links User B to User A
   - Awards credits to both users
   - Cleans up the URL parameter

### Setup (One-Line Configuration)

```ts
// middleware.ts
export { growthKitMiddleware as middleware } from '@fenixblack/growthkit';

export const config = {
  matcher: '/r/:code*'  // Catches referral links like /r/ABC123
};
```

**Required environment variables:**
```env
# For middleware to validate referral codes
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

That's it! The middleware validates referrals server-side, and the React hook handles the rest.

### Custom Configuration (Optional)

```ts
// middleware.ts
import { createGrowthKitMiddleware } from '@fenixblack/growthkit';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!,
  referralPath: '/refer',    // Use /refer/ABC123 instead of /r/ABC123
  redirectTo: '/welcome',    // Redirect to /welcome after processing
  debug: true,               // Enable console logging
});

export const config = {
  matcher: '/refer/:code*'    // Match your custom path
};
```

## Server-Side Usage

### API Routes

Use the server utilities in your Next.js API routes:

```ts
// app/api/generate/route.ts
import { NextRequest } from 'next/server';
import { createGrowthKitServer, getFingerprintFromRequest } from '@fenixblack/growthkit';

export async function POST(request: NextRequest) {
  const gk = createGrowthKitServer(); // Uses GROWTHKIT_API_KEY env var
  
  // Get fingerprint from request
  const fingerprint = getFingerprintFromRequest(request);
  if (!fingerprint) {
    return Response.json({ error: 'Fingerprint required' }, { status: 400 });
  }
  
  // Check user credits
  const user = await gk.getUser(fingerprint);
  if (user.credits < 1) {
    return Response.json({ error: 'Insufficient credits' }, { status: 402 });
  }
  
  // Complete the action
  await gk.completeAction(fingerprint, 'generate');
  
  // Your generation logic here
  return Response.json({ success: true });
}
```

### Server Components (App Router)

```tsx
// app/dashboard/page.tsx
import { GrowthKitServer } from '@fenixblack/growthkit';

async function Dashboard() {
  const gk = new GrowthKitServer({
    apiKey: process.env.GROWTHKIT_API_KEY!,
    apiUrl: process.env.GROWTHKIT_API_URL,
  });
  
  // Server-side data fetching
  const userData = await gk.getUser('fingerprint-from-cookie');
  
  return (
    <div>
      <h1>Credits: {userData.credits}</h1>
    </div>
  );
}
```

### Waitlist API Route

```ts
// app/api/waitlist/route.ts
import { createGrowthKitServer } from '@fenixblack/growthkit';

export async function POST(request: Request) {
  const { email } = await request.json();
  const gk = createGrowthKitServer();
  
  const result = await gk.addToWaitlist(email, undefined, {
    source: 'api',
    timestamp: Date.now(),
  });
  
  return Response.json(result);
}
```

## Advanced Usage

### Custom API Client

For advanced use cases, you can directly use the API client:

```ts
import { GrowthKitAPI } from '@fenixblack/growthkit';

const api = new GrowthKitAPI('your-api-key');
const response = await api.getMe('fingerprint-id');
```

### Fingerprint Utilities

Access fingerprinting utilities directly:

```ts
import { getFingerprint, clearFingerprintCache } from '@fenixblack/growthkit';

const fp = await getFingerprint();
clearFingerprintCache(); // Clear cached fingerprint
```

## Environment Variables

Configure your application with these environment variables:

```env
# Required for client-side (prefix with NEXT_PUBLIC_ for Next.js)
NEXT_PUBLIC_GROWTHKIT_API_KEY=gk_your_api_key_here
NEXT_PUBLIC_GROWTHKIT_API_URL=https://growth.fenixblack.ai/api

# Required for middleware
GROWTHKIT_SERVICE_URL=https://growth.fenixblack.ai

# Required for server-side
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

## TypeScript

This package includes TypeScript definitions. All types are exported:

```ts
import type { 
  GrowthKitConfig,
  GrowthKitState,
  GrowthKitActions,
  GrowthKitPolicy,
  GrowthKitMiddlewareConfig,
  GrowthKitServerConfig
} from '@fenixblack/growthkit';
```

## Features

- 🎣 **React Hook** - Simple `useGrowthKit` hook for client-side integration
- 🔄 **Next.js Middleware** - Built-in middleware for referral link handling
- 🖥️ **Server Utilities** - Server-side API client for API routes and SSR
- 📊 **Complete State Management** - Credits, usage, referrals, waitlist tracking
- 🔐 **Browser Fingerprinting** - Automatic user identification with fallback
- 📱 **Native Share API** - Built-in sharing with fallback to clipboard
- 📝 **TypeScript Support** - Full type definitions included
- 🎯 **Zero Config** - Works out of the box with sensible defaults
- 📦 **Tiny Bundle** - Only 7KB minified + gzipped

## License

MIT © FenixBlack.ai
