'use client';

import { useEffect, useRef } from 'react';
import { GrowthKitAccountWidget, useGrowthKit, type GrowthKitAccountWidgetRef } from '@fenixblack/growthkit';
import { useLanguageContext } from '@/contexts/LanguageContext';

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
  const { language } = useLanguageContext();
  const widgetRef = useRef<GrowthKitAccountWidgetRef>(null);

  const config = {
    // ✨ Client-side only with public key - SDK auto-detects production API
    publicKey: process.env.NEXT_PUBLIC_GROWTHKIT_PUBLIC_KEY!,
    debug: process.env.NODE_ENV === 'development',
    language: language, // Dynamic language from context
    theme: 'auto' as const,
  };

  // Sync widget language when landing page language changes
  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setLanguage(language);
      if (config.debug) {
        console.log('[GrowthKit] Widget language updated to:', language);
      }
    }
  }, [language, config.debug]);

  return (
    <GrowthKitAccountWidget 
      ref={widgetRef}
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
