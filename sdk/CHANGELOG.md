# Changelog

## [0.3.0] - 2024-09-20

### Breaking Changes
- **Removed cookie-based referral tracking** - Now uses URL parameters
- **Middleware now requires API credentials** - Must provide `apiKey` and `apiUrl`
- **Removed cookie utility functions** - `hasReferralClaim`, `getReferralClaim`, `clearReferralClaim` no longer exist

### Changed
- **Middleware behavior**: Now validates referral codes server-side via API call instead of redirecting to external service
- **Referral flow**: Claims are passed via URL parameter (`?ref=TOKEN`) instead of cookies
- **`/v1/me` endpoint**: Now accepts optional `claim` parameter to process referrals during user creation
- **URL cleanup**: Hook automatically removes `?ref=` parameter after processing

### Improved
- **Security**: No external redirects, all validation happens within your domain
- **Performance**: Referral processing happens in a single API call during user creation
- **Privacy**: No cookies needed for referral tracking
- **Developer experience**: Simpler mental model, cleaner URLs

### Migration Guide

1. Update environment variables:
```env
# Old (v0.2.0)
GROWTHKIT_SERVICE_URL=https://your-service.com

# New (v0.3.0)
GROWTHKIT_API_KEY=gk_your_api_key
GROWTHKIT_API_URL=https://your-service.com/api
```

2. Update middleware configuration:
```ts
// Old (v0.2.0)
export const middleware = createGrowthKitMiddleware({
  serviceUrl: process.env.GROWTHKIT_SERVICE_URL!
});

// New (v0.3.0)
export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!
});
```

3. Remove any code using removed utilities:
- `hasReferralClaim()`
- `getReferralClaim()`
- `clearReferralClaim()`

## [0.2.0] - 2024-09-20

### Added
- Next.js middleware support for referral link handling
- Server-side utilities for API routes
- TypeScript definitions for all new features

## [0.1.0] - 2024-09-20

### Initial Release
- `useGrowthKit` React hook
- Browser fingerprinting with fallback
- API client for GrowthKit service
- TypeScript support
