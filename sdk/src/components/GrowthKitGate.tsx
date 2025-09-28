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
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '48px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 24px auto',
              }} />
              <p style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#1e293b',
                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Loading...
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