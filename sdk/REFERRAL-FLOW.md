# GrowthKit Referral Flow Explained

## The Complete Flow (No Cookies, No External Redirects!)

```
1. User A uses your app
   └── useGrowthKit hook generates their unique referral code (e.g., "ABC123")

2. User A shares their link: https://yourapp.com/r/ABC123
   └── gk.share() or gk.getReferralLink()

3. User B clicks the link
   └── Next.js middleware intercepts /r/ABC123

4. Middleware (server-side) validates internally:
   ├── Calls GrowthKit API: POST /v1/referral/exchange
   ├── Exchanges code "ABC123" for a claim token
   └── Redirects to: https://yourapp.com/?ref=CLAIM_TOKEN

5. User B lands on your app with ?ref=CLAIM_TOKEN
   └── useGrowthKit hook initializes:
       ├── Generates User B's fingerprint
       ├── Sees ?ref=CLAIM_TOKEN in URL
       ├── Calls /v1/me with fingerprint + claim
       ├── GrowthKit creates/retrieves User B
       ├── Processes referral (if valid & first time)
       ├── Awards credits to both users
       └── Cleans up URL (removes ?ref=)
```

## Key Benefits of This Approach

✨ **No Cookies** - Better privacy, works with strict cookie policies
✨ **No External Redirects** - Users never leave your domain
✨ **Single API Call** - Referral processing happens during user creation
✨ **Clean URLs** - The ?ref= parameter is automatically removed
✨ **Secure** - HMAC-signed tokens with expiration
✨ **Simple** - Just middleware + hook, that's it!

## What You DON'T Need to Do

❌ Manually handle referral codes
❌ Store referral claims  
❌ Track who referred whom
❌ Calculate credit awards
❌ Validate referral links
❌ Deal with cookies
❌ Handle external redirects

## What You DO Need to Do

✅ Install the SDK
✅ Add 3 lines for middleware
✅ Use the hook
✅ Set environment variables
✅ That's it!

## Code Example

```tsx
// Your entire referral system implementation:

// 1. middleware.ts (entire file)
export { growthKitMiddleware as middleware } from '@fenixblack/growthkit';
export const config = { matcher: '/r/:code*' };

// 2. Your component
function App() {
  const gk = useGrowthKit({ apiKey: 'your-key' });
  
  return (
    <div>
      <p>Credits: {gk.credits}</p>
      <button onClick={() => gk.share()}>
        Share & Earn Credits
      </button>
    </div>
  );
}
```

## Behind the Scenes

When `useGrowthKit` initializes, it automatically:

1. **Generates fingerprint** using browser characteristics
2. **Checks for referral** in URL params (?ref=TOKEN)
3. **Calls /v1/me** with fingerprint + claim token, which:
   - Creates/retrieves user by fingerprint
   - Validates and processes referral claim
   - Awards credits to both referrer and referred
   - Returns user's credits, usage, and referral code
4. **Cleans up the URL** by removing ?ref= parameter

All this happens in ~100ms on mount, completely transparent to your users!

## Advanced: Server-Side Usage

If you need to check credits server-side (e.g., in API routes):

```ts
// app/api/generate/route.ts
import { createGrowthKitServer } from '@fenixblack/growthkit';

export async function POST(request) {
  const gk = createGrowthKitServer();
  const fingerprint = request.headers.get('x-fingerprint');
  
  const user = await gk.getUser(fingerprint);
  if (user.credits < 1) {
    return Response.json({ error: 'No credits' }, { status: 402 });
  }
  
  await gk.completeAction(fingerprint, 'generate');
  // Your logic here
}
```

## Environment Variables

```env
# Client-side (for the React hook)
NEXT_PUBLIC_GROWTHKIT_API_KEY=gk_your_api_key
NEXT_PUBLIC_GROWTHKIT_API_URL=https://growth.fenixblack.ai/api

# Middleware (required for referral validation)
GROWTHKIT_API_KEY=gk_your_api_key
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api

# Server-side (optional, for API routes)
# Uses the same as middleware if you need server utilities
```

## Common Questions

**Q: Do cookies get set for referral tracking?**
A: No! The system uses URL parameters (?ref=TOKEN) temporarily, then cleans them up.

**Q: Does the user get redirected to an external service?**
A: No! Everything happens on your domain. The middleware validates server-side.

**Q: What if users share links on different domains?**
A: The fingerprint system handles cross-domain tracking automatically.

**Q: Can users self-refer?**
A: No, GrowthKit detects and prevents self-referrals.

**Q: Can existing users use referral links?**
A: Yes, but each user can only be referred once (first referral wins).

**Q: What happens if the referral code is invalid?**
A: The middleware redirects to your app without credits - graceful fallback.

**Q: Is the referral processing secure?**
A: Yes! Claims are HMAC-signed tokens with expiration times.

## Technical Details

### How the Middleware Works
1. Intercepts `/r/:code` routes
2. Makes server-side API call to `/v1/referral/exchange`
3. Receives HMAC-signed claim token
4. Redirects to `/?ref=CLAIM_TOKEN`

### How the Hook Processes Referrals
1. Detects `?ref=` parameter in URL
2. Includes claim in `/v1/me` request body
3. Removes `?ref=` from URL using History API

### How the API Validates Claims
1. Verifies HMAC signature
2. Checks expiration time
3. Validates referral code exists
4. Prevents self-referrals
5. Enforces one-referral-per-user rule
6. Respects daily referral caps

### Security Features
- **HMAC Tokens**: Can't be forged
- **Expiration**: Tokens expire in 30 minutes
- **Rate Limiting**: Per IP and per fingerprint
- **Daily Caps**: Limits referral farming
- **Single Use**: Each user can only be referred once
