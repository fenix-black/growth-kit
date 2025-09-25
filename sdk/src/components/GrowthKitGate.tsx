'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { WaitlistForm } from './WaitlistForm';
import { CreditExhaustionModal } from './CreditExhaustionModal';
import type { CreditExhaustionModalRef } from './CreditExhaustionModal';

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
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}>
            <div>Loading...</div>
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