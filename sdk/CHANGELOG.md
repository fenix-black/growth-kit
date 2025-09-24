# Changelog

## [0.1.11] - 2025-09-24

### Changed
- **Credit Granting Logic Refactor**: Simplified and clarified credit granting behavior
  - First-time users always receive `invitation_grant` (5 credits) on registration day
  - Referred users receive `invitation_grant` (5) + `referral` bonus (3) = 8 credits total
  - Daily grants (`daily_grant`) only given on subsequent days, not on registration day
  - This provides clearer semantics: invitation_grant for joining, daily_grant for returning

## [0.1.10] - 2025-09-24

### Fixed
- **Credit Double-Granting Bug**: Fixed referred users incorrectly receiving invitation credits
  - Referred users were getting 11 credits (3 referral + 3 daily + 5 invitation) instead of 8
  - Now correctly receive 8 credits total: 5 initial credits + 3 referral bonus
  - Prevents invitation credits from being granted to users who were referred
  - Referred users get a boosted initial credit amount (5 instead of 3) as an extra incentive

## [0.1.9] - 2025-09-24

### Fixed
- **Referral Code Exchange Bug**: Fixed middleware sending wrong field name to exchange endpoint
  - Middleware was sending `{ code }` instead of `{ referralCode }`
  - This caused 400 errors when trying to use referral links
  - Referral links now work correctly for crediting both referrer and referred users

## [0.1.8] - 2025-09-23

### Fixed
- **React Hooks Closure Issue**: Fixed referral code being null in share function
  - Moved getReferralLink definition before share function to avoid reference errors
  - Added state.referralCode to share function's dependency array
  - Ensures share function always has the latest referral code value
  - Fixes the issue where sharing would fail despite having a valid referral code

## [0.1.7] - 2025-09-23

### Fixed
- **Referral Code Share Protection**: Added check to prevent sharing when no referral code is available
- **Debug Logging**: Added debug logs for troubleshooting referral code issues
  - Logs API response and referral code when received
  - Logs referral link generation in share function
  - Helps identify when/why referral code might be missing

## [0.1.6] - 2025-09-23

### Fixed
- **Share Link Missing**: Fixed issue where the referral link was missing from shared content
  - Reverted to using separate title, text, and URL fields for native share API
  - Ensures compatibility across all platforms and apps
  - URL is passed separately to ensure it's always included
  - Fallback methods still combine text and link

## [0.1.5] - 2025-09-23

### Fixed
- **Share Message Duplication**: Fixed duplicate URLs in shared content
  - Combined title and text into single message
  - Native share API now only receives text field to prevent URL extraction
  - Cleaner output: "Check out this app! Join me and get free credits! [referral-link]"
  - Removed redundant fallback in example app

## [0.1.4] - 2025-09-23

### Fixed
- **Share Message**: Removed duplicate URL from share message
  - Share message now only includes the referral link, not a separate app URL
  - Prevents redundant URLs in shared content
  - Cleaner message: "Join me and get free credits! [referral-link]"

## [0.1.3] - 2025-09-23

### Fixed
- **Referral Link Generation**: Fixed referral links to use app domain instead of API server URL
  - Links now correctly use `window.location.origin` (e.g., `https://restore.fenixblack.ai/r/CODE`)
  - Previously incorrectly used GrowthKit API URL (`https://growth.fenixblack.ai/api/r/CODE`)

## [0.1.0] - 2025-09-23

### Added
- **Invitation Code Handling via Middleware**
  - Middleware now intercepts `/invite/*` paths for invitation codes
  - Automatically handles invitation redemption like referral links
  - Transparent to client applications - just add `/invite/:path*` to matcher
  - Invitation codes (INV-XXXXXX) are processed and grant appropriate credits

## [0.0.9] - 2025-09-23

### Fixed
- **React Hooks Order Violation**: Fixed hooks order error in GrowthKitGate component
  - Moved useEffect hook before conditional returns to comply with React's rules of hooks
  - Prevents "change in the order of Hooks" error

## [0.0.8] - 2025-09-23

### Fixed
- **Waitlist Position Display**: Users already on the waitlist now correctly see their position instead of being blocked
  - Updated `shouldShowWaitlist` logic to include 'waiting' status
  - WaitlistForm component already handled position display, just needed to be shown

## [0.0.7] - 2025-09-23

### Added
- **Email Verification via Middleware**
  - Email verification now handled consistently through middleware
  - Intercepts `/verify` routes and processes verification tokens
  - Redirects with query parameters for success/failure feedback
  - Removes need for separate verification page in client apps

### Enhanced
- **Middleware Consistency**
  - Both referral links and email verification now use the same middleware pattern
  - Simplified client implementation - no special pages needed
  - Query parameter feedback for both flows

### Fixed
- Architectural consistency between referral and verification flows

## [0.0.4] - 2025-09-21

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

## [0.0.3] - 2025-09-20

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
# Old (v0.0.2)
GROWTHKIT_SERVICE_URL=https://your-service.com

# New (v0.0.3)
GROWTHKIT_API_KEY=gk_your_api_key
GROWTHKIT_API_URL=https://your-service.com/api
```

2. Update middleware configuration:
```ts
// Old (v0.0.2)
export const middleware = createGrowthKitMiddleware({
  serviceUrl: process.env.GROWTHKIT_SERVICE_URL!
});

// New (v0.0.3)
export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!
});
```

3. Remove any code using removed utilities:
- `hasReferralClaim()`
- `getReferralClaim()`
- `clearReferralClaim()`

## [0.0.2] - 2025-09-20

### Added
- Next.js middleware support for referral link handling
- Server-side utilities for API routes
- TypeScript definitions for all new features

## [0.0.1] - 2025-09-20

### Initial Release
- `useGrowthKit` React hook
- Browser fingerprinting with fallback
- API client for GrowthKit service
- TypeScript support
