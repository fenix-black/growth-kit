// Import middleware from the Edge Runtime-compatible entry point
// In production, this would be: '@fenixblack/growthkit/middleware'
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`,
  referralPath: '/r',
  redirectTo: '/',
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: '/r/:path*',
};
