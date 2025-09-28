// Auto-middleware for GrowthKit - Zero configuration required!
// Just add: export { middleware, config } from '@growthkit/sdk/auto-middleware';

import { growthKitMiddleware } from './middleware';

// Pre-configured middleware with smart defaults
export const middleware = growthKitMiddleware;

// Pre-configured route matcher with all necessary paths
export const config = {
  matcher: [
    '/r/:path*',           // Referral links
    '/verify',             // Email verification
    '/invite/:path*',      // Invitation links
    '/api/growthkit/:path*' // API proxy
  ],
};
