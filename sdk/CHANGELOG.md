# Changelog

## [0.4.0] - 2025-09-21

### Added
- **USD Value Tracking**
  - Track monetary value of user actions
  - New `usdValue` parameter in `completeAction()` method
  - `totalUsdSpent` and `lastUsdTransaction` state properties
  - `usdTrackingEnabled` flag to check if app has USD tracking enabled
  - Backward compatible - maintains support for old method signature

- **Waitlist Gating System**
  - New `GrowthKitGate` component for automatic waitlist management
  - Built-in `WaitlistForm` component with customizable styling
  - Waitlist state management in `useGrowthKit` hook
  - `acceptInvitation()` method for invited users
  - Master referral code support for invitation emails

### Enhanced
- **Hook State**
  - Added `waitlistEnabled`, `waitlistStatus`, `waitlistPosition` properties
  - Added `waitlistMessage` for custom app messages
  - Added `shouldShowWaitlist` computed property for UI logic
  - Added USD tracking properties for financial analytics
  - Automatic waitlist data parsing from `/v1/me` response

- **completeAction() Method**
  - Now accepts optional `options` parameter with `usdValue` and `metadata`
  - Maintains backward compatibility with old signature
  - Automatically updates USD tracking state when values are returned

### Components
- `GrowthKitGate`: Automatic gating component with loading/error states
- `WaitlistForm`: Fully-featured waitlist form with position tracking

### Documentation
- Added comprehensive waitlist documentation
- Added USD tracking examples and documentation
- Added examples for all waitlist scenarios
- Updated API reference with new properties and methods

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
