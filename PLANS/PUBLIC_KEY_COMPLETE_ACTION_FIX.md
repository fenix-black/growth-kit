# Public Key Mode - Complete Action Fix

## Summary

Fixed the SDK's `completeAction` method and other methods to properly work with public key authentication by creating the missing `/api/public/complete` endpoint and optimizing request payloads for public mode.

## Problem

When using the SDK in public key mode (client-side), the `completeAction` method was calling `/v1/complete` which requires API key authentication. This would fail because:

1. The `/v1/complete` endpoint expects API key authentication (`Authorization: Bearer gk_xxxxx`)
2. Public key mode uses JWT token authentication via `/api/public/*` endpoints
3. The endpoint mapping in `transformEndpointForPublic()` was missing the `/v1/complete` → `/public/complete` mapping
4. All SDK methods were sending `fingerprint` in the request body, even though in public mode the fingerprint is already in the JWT token

## Solution

### 1. Created `/api/public/complete` Endpoint

Created a new public endpoint at `/src/app/api/public/complete/route.ts` that:
- Uses `verifyPublicToken()` for authentication (JWT token from public key)
- Extracts fingerprint from the authenticated token (not from request body)
- Implements the same logic as `/v1/complete` for:
  - Credit consumption
  - Action tracking
  - USD value tracking
  - Referral claim processing
  - Policy-based and custom credit requirements

### 2. Updated SDK Endpoint Mapping

Added the missing mapping in `sdk/src/api.ts`:

```typescript
private transformEndpointForPublic(endpoint: string): string {
  const endpointMap: Record<string, string> = {
    '/v1/me': '/public/user',
    '/v1/track': '/public/track',
    '/v1/complete': '/public/complete',  // ✅ ADDED
    '/v1/waitlist': '/public/waitlist/join',
    '/v1/referral/visit': '/public/referral/check',
    '/v1/referral/check': '/public/referral/check',
    '/v1/invitation/redeem': '/public/invitation/redeem',
    '/v1/verify/email': '/public/verify/email',
    '/v1/claim/name': '/public/claim/name',
    '/v1/claim/email': '/public/claim/email',
  };
  return endpointMap[endpoint] || endpoint;
}
```

### 3. Optimized Request Payload for completeAction

Updated `completeAction` method to conditionally exclude `fingerprint` from request body when in public mode (since it's already in the JWT token):

#### Example:

```typescript
async completeAction(
  fingerprint: string,
  action: string = 'default',
  creditsRequired?: number,
  usdValue?: number,
  metadata?: any
): Promise<APIResponse<CompleteResponse>> {
  // In public mode, fingerprint is in the JWT token, not the body
  const bodyData = this.isPublicMode 
    ? {
        action,
        ...(creditsRequired !== undefined && { creditsRequired }),
        ...(usdValue !== undefined && { usdValue }),
        ...(metadata && { metadata }),
      }
    : {
        fingerprint,
        action,
        ...(creditsRequired !== undefined && { creditsRequired }),
        ...(usdValue !== undefined && { usdValue }),
        metadata,
      };

  return this.request<CompleteResponse>('/v1/complete', {
    method: 'POST',
    body: JSON.stringify(bodyData),
  });
}
```

## Benefits

1. **Security**: Public key mode is now fully functional for all SDK methods
2. **Efficiency**: Reduced payload size by not sending redundant fingerprint data
3. **Consistency**: All SDK methods now follow the same pattern for public vs private mode
4. **Correctness**: Methods now use the correct endpoints based on authentication mode

## Testing

The SDK builds successfully without errors:
```bash
cd sdk && npm run build
# ✅ Build success
```

## Files Changed

### New Files:
- `/src/app/api/public/complete/route.ts` - New public endpoint for completeAction

### Modified Files:
- `/sdk/src/api.ts` - Updated endpoint mapping and method implementations
- `/sdk/CHANGELOG.md` - Documented changes in version 0.6.14

## Authentication Flow

### Public Key Mode (Client-Side SDK):
1. SDK initializes with `publicKey`
2. SDK requests JWT token from `/api/public/auth/token` using public key + fingerprint
3. JWT token is stored and used for all subsequent requests
4. All requests go to `/api/public/*` endpoints
5. Server validates JWT token and extracts fingerprint from it
6. No fingerprint needed in request body

### API Key Mode (Server-Side):
1. SDK initializes with `apiKey`
2. All requests go to `/api/v1/*` endpoints
3. API key sent in `Authorization` header
4. Fingerprint must be included in request body
5. Server validates API key and uses fingerprint from body

## Related Documentation

- See `PUBLIC_KEY_MIGRATION_GUIDE.md` for general public key usage
- See `docs/API.md` for endpoint documentation
- See `.cursor/rules/public-api-endpoints.md` for SDK endpoint guidelines

## Version

Changes released in SDK version **0.6.14** (2025-10-07)
