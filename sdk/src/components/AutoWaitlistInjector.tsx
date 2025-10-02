'use client';

import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useGrowthKit } from '../useGrowthKit';
import { EmbedWaitlistWidget } from './EmbedWaitlistWidget';
import { GrowthKitProvider, useGrowthKitConfig } from './GrowthKitProvider';

/**
 * Automatically injects waitlist widget into specified CSS selector
 * if app is configured with layout="embed" and targetSelector
 */
export function AutoWaitlistInjector() {
  const { app, waitlistEnabled } = useGrowthKit();
  const { config } = useGrowthKitConfig();

  useEffect(() => {
    // Only auto-inject if:
    // 1. Waitlist is enabled
    // 2. Layout is set to "embed"
    // 3. Target selector is configured
    const targetSelector = (app as any)?.metadata?.waitlistTargetSelector;
    
    if (!waitlistEnabled || app?.waitlistLayout !== 'embed' || !targetSelector) {
      return;
    }

    // Find target element
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.warn(`[GrowthKit] Auto-inject: Target element "${targetSelector}" not found`);
      return;
    }

    // Create container for React
    const container = document.createElement('div');
    container.id = 'growthkit-auto-waitlist';
    targetElement.innerHTML = ''; // Clear existing content
    targetElement.appendChild(container);

    // Render the widget
    const root = createRoot(container);
    root.render(
      <GrowthKitProvider config={config}>
        <EmbedWaitlistWidget variant="standard" />
      </GrowthKitProvider>
    );

    if (config.debug) {
      console.log('[GrowthKit] Auto-injected waitlist widget into:', targetSelector);
    }

    // Cleanup on unmount
    return () => {
      root.unmount();
    };
  }, [app, waitlistEnabled, config]);

  return null; // This component doesn't render anything itself
}

