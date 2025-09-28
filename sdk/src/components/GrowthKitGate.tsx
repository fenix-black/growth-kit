'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { WaitlistForm } from './WaitlistForm';
import { CreditExhaustionModal } from './CreditExhaustionModal';
import type { CreditExhaustionModalRef } from './CreditExhaustionModal';
import { useTranslation } from '../localization';

interface GrowthKitGateProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function GrowthKitGate({ children, loadingComponent }: GrowthKitGateProps) {
  const { 
    loading, 
    initialized, 
    shouldShowWaitlist,
    credits,
    waitlistEnabled 
  } = useGrowthKit();
  
  const { themeColors } = useGrowthKitConfig();
  const { t } = useTranslation();
  const creditModalRef = useRef<CreditExhaustionModalRef>(null);

  // Show credit exhaustion modal when needed
  // Must be before any conditional returns to follow React's rules of hooks
  useEffect(() => {
    if (credits === 0 && !loading && !waitlistEnabled) {
      creditModalRef.current?.open();
    }
  }, [credits, loading, waitlistEnabled]);

  // Show loading state
  if (loading || !initialized) {
    return (
      <>
        {loadingComponent || (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            background: themeColors.primaryGradient,
          }}>
            <div style={{
              background: themeColors.backgroundGlass,
              borderRadius: '20px',
              padding: '48px',
              boxShadow: themeColors.shadowLg,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${themeColors.borderLight}`,
              textAlign: 'center',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${themeColors.border}`,
                borderTop: `3px solid ${themeColors.primary}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 24px auto',
              }} />
              <p style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: themeColors.text,
                background: themeColors.primaryGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {t('widget.loading')}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Show waitlist if required
  if (shouldShowWaitlist) {
    return <WaitlistForm />;
  }

  return (
    <>
      {children}
      <CreditExhaustionModal ref={creditModalRef} />
    </>
  );
}