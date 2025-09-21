import React, { ReactNode } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { GrowthKitConfig } from '../types';
import { WaitlistForm } from './WaitlistForm';

export interface GrowthKitGateProps {
  config: GrowthKitConfig;
  children: ReactNode;
  waitlistComponent?: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * GrowthKitGate component - Gates content behind waitlist when enabled
 * 
 * @example
 * ```tsx
 * <GrowthKitGate config={{ apiKey: 'your-api-key' }}>
 *   <YourApp />
 * </GrowthKitGate>
 * ```
 */
export function GrowthKitGate({
  config,
  children,
  waitlistComponent,
  loadingComponent,
}: GrowthKitGateProps) {
  const growthKit = useGrowthKit(config);
  
  // Show loading component while initializing
  if (growthKit.loading) {
    return (
      <>
        {loadingComponent || (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 16px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
              </style>
              <p style={{ color: '#666' }}>Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Show error if initialization failed
  if (growthKit.error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          maxWidth: '400px',
        }}>
          <h2 style={{ color: '#e74c3c' }}>Error</h2>
          <p style={{ color: '#666' }}>{growthKit.error.message}</p>
        </div>
      </div>
    );
  }

  // Show waitlist if required
  if (growthKit.shouldShowWaitlist) {
    return (
      <>
        {waitlistComponent || (
          <WaitlistForm 
            growthKit={growthKit}
            message={growthKit.waitlistMessage}
          />
        )}
      </>
    );
  }

  // Show invitation prompt if invited
  if (growthKit.waitlistStatus === 'invited') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '40px',
          maxWidth: '500px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ marginBottom: '20px' }}>You're Invited!</h1>
          <p style={{ marginBottom: '30px', opacity: 0.95 }}>
            Great news! You've been selected to join. Click below to accept your invitation and get started.
          </p>
          <button
            onClick={() => growthKit.acceptInvitation()}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Accept Invitation
          </button>
        </div>
      </div>
    );
  }

  // Show children (main app content)
  return <>{children}</>;
}
