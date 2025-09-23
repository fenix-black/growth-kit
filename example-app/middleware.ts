// Import middleware from the Edge Runtime-compatible entry point
import { createGrowthKitMiddleware } from '@growthkit/sdk/middleware';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL || 'http://localhost:3000/api',
  referralPath: '/r',
  redirectTo: '/',
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: ['/r/:path*', '/verify'],
};
