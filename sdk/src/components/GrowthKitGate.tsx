'use client';

import React, { useEffect, useState } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { WaitlistForm } from './WaitlistForm';
import { CreditExhaustionModal } from './CreditExhaustionModal';

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
  
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Show credit exhaustion modal when needed
  // Must be before any conditional returns to follow React's rules of hooks
  useEffect(() => {
    if (credits === 0 && !loading && !waitlistEnabled) {
      setShowCreditModal(true);
    } else if (credits > 0) {
      setShowCreditModal(false);
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
      {showCreditModal && (
        <CreditExhaustionModal 
          onClose={() => setShowCreditModal(false)} 
        />
      )}
    </>
  );
}