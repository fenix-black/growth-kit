'use client';

import { useEffect } from 'react';
import { GrowthKitAccountWidget, useGrowthKit } from '@fenixblack/growthkit';

// Analytics wrapper that tracks landing page interactions
function LandingPageTracker({ children }: { children: React.ReactNode }) {
  const { track } = useGrowthKit();

  useEffect(() => {
    // Track page view
    track('landing_page_viewed', { 
      page: 'home',
      timestamp: Date.now(),
      referrer: document.referrer
    });


    // Track time spent on page
    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime;
      track('landing_page_exit', { 
        timeSpent: Math.floor(timeSpent / 1000)
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [track]);

  return <>{children}</>;
}

export default function LandingPageProvider({ children }: { children: React.ReactNode }) {
  const config = {
    // No apiKey needed - uses secure proxy mode automatically via middleware
    debug: process.env.NODE_ENV === 'development',
    language: 'en' as const,
    theme: 'auto' as const,
  };

  return (
    <GrowthKitAccountWidget 
      config={config}
      position="bottom-right"
      slim={true}
      slim_labels={false}
      showName={true}
      showEmail={true}
      theme="auto"
    >
      <LandingPageTracker>
        {children}
      </LandingPageTracker>
    </GrowthKitAccountWidget>
  );
}
