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

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercentage > 0) {
          track('landing_page_scrolled', { 
            percentage: scrollPercentage,
            section: getCurrentSection()
          });
        }
      }, 1000);
    };

    const getCurrentSection = () => {
      const sections = ['hero', 'features', 'examples', 'integration', 'get-started'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            return section;
          }
        }
      }
      return 'unknown';
    };

    // Track time spent on page
    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime;
      track('landing_page_exit', { 
        timeSpent: Math.floor(timeSpent / 1000),
        lastSection: getCurrentSection()
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(scrollTimeout);
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
