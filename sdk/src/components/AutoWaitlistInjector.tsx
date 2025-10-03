'use client';

import React, { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
  const rootRef = useRef<Root | null>(null);
  const injectedRef = useRef<boolean>(false);

  useEffect(() => {
    // Skip if already injected
    if (injectedRef.current) {
      return;
    }

    // Wait for app data to load
    if (!app) {
      return;
    }

    // Only auto-inject if:
    // 1. Waitlist is enabled
    // 2. Layout is set to "embed"
    // 3. Target selector is configured
    const targetSelector = (app as any)?.metadata?.waitlistTargetSelector;
    
    if (!waitlistEnabled || app.waitlistLayout !== 'embed' || !targetSelector) {
      return;
    }

    // Find target element
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.warn(`[GrowthKit] Auto-inject: Target element "${targetSelector}" not found`);
      return;
    }

    // Check if already injected in DOM
    if (targetElement.querySelector('#growthkit-auto-waitlist')) {
      injectedRef.current = true;
      return;
    }

    // Create container for React
    const container = document.createElement('div');
    container.id = 'growthkit-auto-waitlist';
    targetElement.innerHTML = ''; // Clear existing content
    targetElement.appendChild(container);

    // Render the widget
    const root = createRoot(container);
    rootRef.current = root;
    root.render(
      <GrowthKitProvider config={config}>
        <EmbedWaitlistWidget variant="standard" />
      </GrowthKitProvider>
    );

    injectedRef.current = true;

    if (config.debug) {
      console.log('[GrowthKit] Auto-injected waitlist widget into:', targetSelector);
    }

    // Cleanup on unmount (component unmount only)
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      injectedRef.current = false;
    };
  }, [app, waitlistEnabled]); // Simplified dependencies - only re-run if these change

  return null; // This component doesn't render anything itself
}

