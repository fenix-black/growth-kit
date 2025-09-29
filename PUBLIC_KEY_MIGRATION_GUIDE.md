# GrowthKit Public Key Migration Guide

GrowthKit now supports **client-side only integration** using public keys, eliminating the need for backend middleware in many scenarios. This guide explains how to migrate from the middleware approach to the new public key approach.

## Overview

### Before (Middleware Required)
```
Client → Your Backend Middleware → GrowthKit Server
```
- Required backend/middleware setup
- Private API key handled server-side
- Limited to full-stack applications

### After (Public Key Mode)
```
Client → GrowthKit Server (Direct)
```
- No backend required
- Public key safe for client-side use
- Works with static sites, SPAs, and full-stack apps

## Benefits of Public Key Mode

✅ **No Backend Required** - Works with static sites, GitHub Pages, Netlify, etc.  
✅ **Simpler Setup** - One-line initialization  
✅ **Better Security** - Public keys are safe to expose, tokens are scoped and time-limited  
✅ **Same Features** - All GrowthKit features work the same way  
✅ **Better Performance** - Direct API calls, no middleware overhead  

## Getting Your Public Key

1. Go to your app in the GrowthKit admin dashboard
2. Navigate to the **API Tokens** tab
3. Copy your **Public Key** (starts with `pk_`)

![Public Key Location](docs/public-key-location.png)

## Migration Steps

### Step 1: Update Your GrowthKit SDK

Make sure you're using the latest version of the GrowthKit SDK:

```bash
npm install @fenixblack/growthkit@latest
```

### Step 2: Update Your Integration

#### Before (Middleware Mode)
```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const growthkit = useGrowthKit({
    // No config needed - uses middleware
  });
  
  // Rest of your app...
}
```

#### After (Public Key Mode)
```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const growthkit = useGrowthKit({
    publicKey: 'pk_your_public_key_here'
  });
  
  // Rest of your app - everything else stays the same!
}
```

### Step 3: Remove Middleware (Optional)

If you no longer need the middleware for other purposes, you can remove it:

```typescript
// You can remove this file
// middleware.ts
```

## Integration Examples

### React SPA (Create React App)

```tsx
import React from 'react';
import { useGrowthKit, GrowthKitProvider } from '@fenixblack/growthkit';

function App() {
  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key_here' }}>
      <MyApp />
    </GrowthKitProvider>
  );
}

function MyApp() {
  const { track, credits, user } = useGrowthKit();
  
  return (
    <div>
      <h1>Credits: {credits}</h1>
      <button onClick={() => track('button_click')}>
        Track Event
      </button>
    </div>
  );
}
```

### Vanilla JavaScript (Static Sites)

```html
<!DOCTYPE html>
<html>
<head>
    <title>GrowthKit Demo</title>
    <script src="https://unpkg.com/@fenixblack/growthkit@latest/dist/index.js"></script>
</head>
<body>
    <div id="credits">Loading...</div>
    <button onclick="trackClick()">Track Click</button>

    <script>
        const growthkit = new GrowthKit({
            publicKey: 'pk_your_key_here'
        });

        async function init() {
            await growthkit.initialize();
            document.getElementById('credits').textContent = 
                `Credits: ${growthkit.getCredits()}`;
        }

        function trackClick() {
            growthkit.track('button_click');
        }

        init();
    </script>
</body>
</html>
```

### Next.js App Router

```tsx
'use client';

import { useGrowthKit, GrowthKitProvider } from '@fenixblack/growthkit';

export default function ClientComponent() {
  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key_here' }}>
      <GrowthKitWidget />
    </GrowthKitProvider>
  );
}

function GrowthKitWidget() {
  const { credits, track, user } = useGrowthKit();
  
  return (
    <div className="p-4 border rounded">
      <h3>Credits: {credits}</h3>
      {user.name && <p>Welcome, {user.name}!</p>}
      <button onClick={() => track('feature_used')}>
        Use Feature
      </button>
    </div>
  );
}
```

## Security & Rate Limiting

### Public Key Safety
- **Safe to expose**: Public keys are designed to be included in client-side code
- **Scoped access**: Public tokens only work for the specific fingerprint that requested them
- **Time-limited**: Tokens expire after 30 minutes and are automatically refreshed
- **Origin validation**: Requests are validated against your app's allowed origins

### Built-in Protection
- **Rate limiting**: 50 events per minute per fingerprint (vs 100 for private API)
- **Credit validation**: All credit-earning actions are validated server-side
- **Abuse detection**: Unusual patterns are automatically flagged
- **Audit trails**: All activities are logged for monitoring

## Configuration Options

```tsx
const config = {
  // Required: Your public key
  publicKey: 'pk_your_key_here',
  
  // Optional: Custom API URL (defaults to growth.fenixblack.ai)
  apiUrl: 'https://your-custom-domain.com/api',
  
  // Optional: Enable debug mode
  debug: true,
  
  // Optional: Set language
  language: 'en', // or 'es'
  
  // Optional: Set theme
  theme: 'auto' // 'light', 'dark', or 'auto'
};
```

## Compatibility

### Backward Compatibility
The middleware approach continues to work - you can migrate at your own pace.

### Feature Parity
All GrowthKit features work the same way in public key mode:
- ✅ Event tracking
- ✅ Credit system
- ✅ Referral tracking
- ✅ Waitlist management
- ✅ User profiles
- ✅ Email verification

## Troubleshooting

### Common Issues

#### "Failed to obtain authentication token"
- **Cause**: Invalid public key or network issues
- **Solution**: Check your public key is correct and starts with `pk_`

#### "Origin not allowed for this app"
- **Cause**: Your domain isn't in the allowed origins list
- **Solution**: Add your domain to the CORS origins in the app settings

#### Rate limit exceeded
- **Cause**: Too many requests from the same fingerprint
- **Solution**: Implement debouncing or reduce event frequency

### Debug Mode

Enable debug mode to see detailed logs:

```tsx
const growthkit = useGrowthKit({
  publicKey: 'pk_your_key_here',
  debug: true
});
```

This will log:
- Token requests and renewals
- API calls and responses
- Error details
- Performance metrics

## Migration Checklist

- [ ] Update to latest GrowthKit SDK version
- [ ] Copy public key from dashboard
- [ ] Update GrowthKit configuration
- [ ] Test in development environment
- [ ] Verify all features work correctly
- [ ] Deploy to production
- [ ] Monitor for any issues
- [ ] (Optional) Remove middleware if no longer needed

## Need Help?

If you encounter any issues during migration:

1. Check the browser console for error messages
2. Enable debug mode for detailed logs
3. Verify your public key and allowed origins
4. Contact support with specific error details

---

**Note**: This migration is optional. The middleware approach continues to work and is still recommended for applications that require server-side API key security or have specific backend integration needs.
