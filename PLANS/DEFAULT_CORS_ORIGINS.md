# Default CORS Origins Implementation

## Overview

This document describes the implementation of default CORS origins that are always allowed without needing to be configured per-app.

## Default Allowed Origins

The following origins are **always allowed** and don't need to be added to each app's CORS configuration:

1. **`localhost` on any port**
   - Examples: `http://localhost:3000`, `https://localhost:8080`
   - Use case: Local development

2. **`127.0.0.1` on any port**
   - Examples: `http://127.0.0.1:3000`, `https://127.0.0.1:5173`
   - Use case: Local development (IP address)

3. **`*.vusercontent.net` (all subdomains)**
   - Examples: `https://preview-fenixblack-landing-page-kzmncgg3bcjmojevq5o5.vusercontent.net`
   - Use case: Vercel v0 preview sites

## Implementation Details

### Core Logic

The implementation is in `/src/lib/middleware/cors.ts`:

- **`isDefaultOriginAllowed(origin)`**: Checks if an origin matches default patterns
- **`isConfiguredOriginAllowed(origin, allowedOrigins)`**: Checks configured origins
- **`isOriginAllowed(origin, configuredOrigins)`**: Public API that combines both checks
- **`corsHeaders(origin, allowedOrigins)`**: Generates CORS headers (updated to use new logic)

### Updated API Routes

The following **22 routes** have been updated to use the new `isOriginAllowed()` function:

#### Public API Routes (`/api/public/*`)
1. `/api/public/user/route.ts` - User data endpoint
2. `/api/public/waitlist/join/route.ts` - Waitlist join
3. `/api/public/products/[tag]/route.ts` - Product details
4. `/api/public/products/route.ts` - Products list
5. `/api/public/auth/token/route.ts` - Token authentication
6. `/api/public/claim/email/route.ts` - Email claim
7. `/api/public/claim/name/route.ts` - Name claim
8. `/api/public/invitation/redeem/route.ts` - Invitation redemption
9. `/api/public/verify/email/route.ts` - Email verification
10. `/api/public/referral/check/route.ts` - Referral check
11. `/api/public/track/route.ts` - Activity tracking

#### V1 API Routes (`/api/v1/*`)
12. `/api/v1/me/route.ts` - User data endpoint (v1)
13. `/api/v1/track/route.ts` - Activity tracking (v1)
14. `/api/v1/complete/route.ts` - Complete action
15. `/api/v1/referral/exchange/route.ts` - Exchange referral
16. `/api/v1/referral/visit/route.ts` - Record referral visit
17. `/api/v1/waitlist/route.ts` - Waitlist management
18. `/api/v1/claim/email/route.ts` - Email claim (v1)
19. `/api/v1/claim/name/route.ts` - Name claim (v1)
20. `/api/v1/verify/email/route.ts` - Email verification (v1)
21. `/api/v1/send-verification/route.ts` - Send verification email
22. `/api/v1/waitlist/redeem/route.ts` - Redeem waitlist invitation

### Pattern Matching

The implementation uses smart pattern matching:

```javascript
// For localhost/127.0.0.1: matches any port
const url = new URL(origin);
if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
  return true;
}

// For wildcards: checks if hostname ends with the domain
if (pattern.startsWith('*.')) {
  const domain = pattern.slice(2); // 'vusercontent.net'
  if (url.hostname.endsWith(domain)) {
    return true;
  }
}
```

## Security Considerations

### Safe Defaults

- **localhost/127.0.0.1**: Safe because these addresses are only accessible locally
- **vusercontent.net**: Safe because it's Vercel's trusted preview domain

### Attack Prevention

The implementation prevents common attacks:

1. **Subdomain spoofing**: `malicious-vusercontent.net.evil.com` is rejected because `hostname.endsWith('vusercontent.net')` checks the exact ending
2. **Port scanning**: Only the hostname is checked, not the port, so any port is allowed for localhost/127.0.0.1

## Testing

A test script is available at `/scripts/test-default-cors.js`:

```bash
node scripts/test-default-cors.js
```

This tests all patterns including:
- Various localhost ports
- Various 127.0.0.1 ports  
- Vercel v0 preview URLs
- Negative cases (domains that should NOT match)

## User Experience

### Before

Users had to manually add localhost and development origins to every app's CORS configuration:

```json
{
  "corsOrigins": [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://my-preview.vusercontent.net"
  ]
}
```

### After

Users only need to configure production domains:

```json
{
  "corsOrigins": [
    "https://myapp.com",
    "https://*.myapp.com"
  ]
}
```

Development origins (localhost, 127.0.0.1, *.vusercontent.net) work automatically!

## Backwards Compatibility

✅ **Fully backwards compatible**

- Existing configured origins continue to work
- No database changes required
- No API changes required
- Apps with explicit localhost/127.0.0.1 entries will continue to work (they're just redundant now)

## Adding More Default Origins

To add more default origins in the future, edit the `DEFAULT_ALLOWED_ORIGINS` array in `/src/lib/middleware/cors.ts`:

```typescript
const DEFAULT_ALLOWED_ORIGINS = [
  'localhost',
  '127.0.0.1',
  '*.vusercontent.net',
  // Add more here as needed
  '*.example-preview-service.com',
];
```

The matching logic will automatically handle both exact matches and wildcard patterns.

