# GrowthKit Middleware (Advanced Integration)

This guide covers server-side middleware integration for Next.js applications. This is an **advanced setup** - most users should use the [client-side public key integration](./README.md) instead.

## When to Use Middleware

**Use middleware if you need:**
- Server-side API key security (hide keys from client)
- Custom referral link routing (`/r/ABC123`)
- Email verification handling (`/verify?token=xyz`)
- Invitation code processing (`/invite/INV-XXXXXX`)
- API request proxying through your server

**Don't use middleware if:**
- You're building a static site or SPA
- You want the simplest possible integration
- You don't need custom routing
- Client-side public keys work for you (recommended)

## Quick Setup

### Automated Setup (Recommended)

```bash
npx @fenixblack/growthkit setup
```

The CLI will:
1. Detect your Next.js project
2. Create `middleware.ts` with auto-middleware
3. Set up environment variables in `.env.local`
4. Provide next steps

### Manual Setup

#### 1. Install the SDK

```bash
npm install @fenixblack/growthkit
```

#### 2. Create Middleware File

Create `middleware.ts` in your Next.js root:

```ts
// middleware.ts - Zero configuration required! 🚀
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';
```

#### 3. Set Environment Variables

Create or update `.env.local`:

```env
# .env.local - Server-side only (secure)
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

> **🔒 Important**: Use a **private API key** (starts with `gk_`), not a public key. Get this from your dashboard → API Tokens.

#### 4. Use in Your App

```tsx
'use client';

import { GrowthKitAccountWidget } from '@fenixblack/growthkit';

export default function App() {
  return (
    <GrowthKitAccountWidget
      config={{
        // No keys needed - middleware handles authentication
        debug: process.env.NODE_ENV === 'development'
      }}
      position="top-right"
    >
      <YourApp />
    </GrowthKitAccountWidget>
  );
}
```

## What the Middleware Does

The auto-middleware automatically handles:

### 1. Referral Links
- Routes: `/r/:code`
- Exchanges referral code for claim token
- Sets secure cookie
- Redirects to your app with `?ref=token`

### 2. Email Verification
- Routes: `/verify?token=xyz`
- Verifies email token
- Grants verification credit
- Redirects with `?verified=true/false`

### 3. Invitation Codes
- Routes: `/invite/:code`
- Validates invitation code
- Grants invitation credits
- Redirects with invitation token

### 4. API Proxying
- Routes: `/api/growthkit/*`
- Securely proxies widget API calls
- Injects server-side credentials
- Never exposes API keys to client

## Advanced Configuration

If you need custom paths or settings:

```ts
// middleware.ts - Custom configuration
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!,
  referralPath: '/r',      // Custom referral path
  verifyPath: '/verify',   // Custom verify path
  invitePath: '/invite',   // Custom invite path
  redirectTo: '/home',     // Custom redirect destination
  debug: true,             // Force debug mode
});

export const config = {
  matcher: [
    '/r/:code*', 
    '/verify', 
    '/invite/:code*', 
    '/api/growthkit/:path*'
  ]
};
```

## Handling Redirects

The middleware redirects users after processing. Handle these in your app:

```tsx
'use client';

import { useEffect } from 'react';
import { useGrowthKit } from '@fenixblack/growthkit';
import toast from 'react-hot-toast';

export default function App() {
  const gk = useGrowthKit();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Email verification
    if (params.get('verified') === 'true') {
      toast.success('Email verified! +1 credit earned');
      gk.refresh();
      window.history.replaceState({}, '', '/');
    } else if (params.get('verified') === 'false') {
      toast.error('Verification failed or expired');
      window.history.replaceState({}, '', '/');
    }
    
    // Referral applied
    if (params.get('ref')) {
      toast.success('Referral applied! Welcome!');
      window.history.replaceState({}, '', '/');
    }
    
    // Invitation applied
    if (params.get('invited') === 'true') {
      toast.success('Invitation accepted! Credits granted');
      gk.refresh();
      window.history.replaceState({}, '', '/');
    }
  }, [gk]);

  return <YourApp />;
}
```

## Import Paths

The SDK provides separate entry points for different environments:

### Client-Side (React)
```tsx
import { 
  useGrowthKit, 
  GrowthKitProvider,
  GrowthKitAccountWidget,
  WaitlistForm
} from '@fenixblack/growthkit';
```

### Middleware (Edge Runtime)
```ts
// Zero-config middleware
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';

// Or advanced configuration
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';
```

### Server Utilities (Node.js)
```ts
import { GrowthKitServer, createGrowthKitServer } from '@fenixblack/growthkit/server';

const gk = createGrowthKitServer({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!
});

// Server-side operations
const user = await gk.getUser('fingerprint-123');
await gk.completeAction('fingerprint-123', 'generate');
await gk.addToWaitlist('user@example.com', 'fingerprint-123');
```

## Migration from Legacy Setup

If you're upgrading from an older version that used `NEXT_PUBLIC_GROWTHKIT_API_KEY`:

### 1. Update Environment Variables

```env
# Remove (old, insecure):
# NEXT_PUBLIC_GROWTHKIT_API_KEY=...
# NEXT_PUBLIC_GROWTHKIT_API_URL=...

# Add (new, secure):
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

### 2. Simplify Middleware

```ts
// Replace your entire middleware.ts with:
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';
```

### 3. Update Widget Config

```tsx
// Old way (deprecated):
<GrowthKitProvider config={{ 
  apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY 
}}>

// New way (secure):
<GrowthKitProvider config={{ 
  // No keys needed - middleware handles it
  debug: process.env.NODE_ENV === 'development'
}}>
```

## Security Benefits

**Middleware mode provides:**
- ✅ API keys never exposed to client
- ✅ Server-side token generation
- ✅ Secure request signing
- ✅ Rate limiting and abuse prevention
- ✅ Custom authentication logic

**vs Public Key Mode:**
- Public keys are designed to be safe in client-side code
- They use time-limited, user-scoped tokens
- Simpler setup, faster integration
- No server required

## Troubleshooting

### Middleware not running

**Check:**
1. File is named `middleware.ts` (not `middleware.tsx`)
2. File is in project root (same level as `app/` or `pages/`)
3. Matcher patterns in `config` are correct
4. Environment variables are set in `.env.local`

### API calls failing

**Check:**
1. Environment variables are loaded (`console.log(process.env.GROWTHKIT_API_KEY)`)
2. API key is valid (test in dashboard)
3. Middleware matcher includes `/api/growthkit/:path*`
4. Widget config doesn't include `apiKey` or `publicKey` (should be empty for proxy mode)

### Redirects not working

**Check:**
1. Matcher includes your route patterns
2. `redirectTo` path exists in your app
3. No other middleware conflicting
4. Debug mode enabled to see logs

## Performance

**Edge Runtime:**
- Middleware runs on Vercel Edge network
- < 50ms cold start globally
- Zero backend scaling needed
- Automatic CDN distribution

**Optimized for:**
- Minimal latency
- Global deployment
- High traffic apps
- Real-time operations

## Support

- **Client-side setup**: See [README.md](./README.md)
- **Issues**: [GitHub Issues](https://github.com/fenixblack/growthkit/issues)
- **Documentation**: [docs.fenixblack.ai](https://docs.fenixblack.ai)

## License

MIT
