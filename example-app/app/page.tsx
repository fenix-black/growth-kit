'use client';

import { GrowthKitAccountWidget, useGrowthKit } from '@growthkit/sdk';
import { useState, useRef, useEffect } from 'react';
import type { GrowthKitAccountWidgetRef } from '@growthkit/sdk';

// Main App Component (now completely GrowthKit-agnostic)
function MainApp({ accountWidgetRef }: { accountWidgetRef: React.RefObject<GrowthKitAccountWidgetRef | null> }) {
  const { credits, completeAction, policy } = useGrowthKit();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Monitor credit changes
  useEffect(() => {
    console.log('Credits updated:', credits);
  }, [credits]);
  
  const handleUseFeature = async () => {
    console.log('Credits before action:', credits);
    setIsProcessing(true);
    const success = await completeAction('generate');
    setIsProcessing(false);
    
    if (success) {
      // Note: The credits value here is still the old value due to React's closure
      // The widget will update automatically when the context updates
      console.log('Feature used successfully!');
    } else {
      console.log('Not enough credits');
    }
  };

  const handleTestEarnCredits = () => {
    console.log('Button clicked, widget ref:', accountWidgetRef.current);
    accountWidgetRef.current?.openEarnCreditsModal();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Example App</h1>
        <div style={styles.headerActions}>
          <button 
            onClick={handleTestEarnCredits}
            style={styles.testButton}
            aria-label="Open earn credits modal"
          >
            🎯 Manage Account
          </button>
        </div>
      </div>

      {/* Marketing Message */}
      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>Welcome to Example App</h2>
        <p style={styles.heroText}>Each action uses 1 credit. Earn credits through various actions!</p>
        <p style={styles.heroSubtext}>Check your account widget to see your balance and earn more credits</p>
      </div>

      {/* Main Action */}
      <div style={styles.actionArea}>
        <button 
          onClick={handleUseFeature}
          disabled={credits < 1 || isProcessing}
          style={{
            ...styles.primaryButton,
            ...(credits < 1 || isProcessing ? styles.disabledButton : {})
          }}
        >
          {isProcessing ? 'Processing...' : 'Use Feature (1 credit)'}
        </button>
        
        {credits === 0 && (
          <p style={styles.warning}>
            Out of credits! The account widget will help you earn more.
          </p>
        )}
      </div>

      {/* Referral Section */}
      <div style={styles.referralSection}>
        <h3 style={styles.sectionTitle}>Share & Earn Credits</h3>
        <p style={styles.sectionText}>
          Invite friends and earn {policy?.referralCredits || 5} credits for each referral!
        </p>
        <button 
          onClick={() => accountWidgetRef.current?.openEarnCreditsModal()}
          style={styles.secondaryButton}
        >
          Open Earn Credits Modal
        </button>
      </div>

      {/* Developer Info */}
      <div style={styles.devInfo}>
        <h4 style={styles.devTitle}>🎯 GrowthKit Account Widget</h4>
        <p style={styles.devText}>
          Notice the account widget in the top-right corner! It shows your:
        </p>
        <ul style={styles.devList}>
          <li>Current credits balance</li>
          <li>Profile completion status</li>
          <li>Easy access to earn more credits</li>
          <li>Automatic flow management (waitlist, credit exhaustion)</li>
        </ul>
        <p style={styles.devText}>
          This widget is part of the GrowthKit SDK and can be easily integrated into any app.
        </p>
      </div>
    </div>
  );
}

// Main Page Component - Now uses the new all-in-one widget
export default function HomePage() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || '',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`,
    debug: process.env.NODE_ENV === 'development',
  };

  const accountWidgetRef = useRef<GrowthKitAccountWidgetRef>(null);

  return (
    <>
      <GrowthKitAccountWidget 
        config={config}
        ref={accountWidgetRef}
        position="top-right"
        theme="auto"
        onCreditsChange={(credits: number) => {
          console.log('Credits updated:', credits);
        }}
        onProfileChange={(profile: { name?: string; email?: string; verified?: boolean }) => {
          console.log('Profile updated:', profile);
        }}
      >
        <MainApp accountWidgetRef={accountWidgetRef} />
      </GrowthKitAccountWidget>
    </>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e0e0e0',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  testButton: {
    background: '#f0f0f0',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
    borderRadius: '12px',
  },
  heroTitle: {
    fontSize: '1.75rem',
    color: '#333',
    marginBottom: '0.5rem',
  },
  heroText: {
    fontSize: '1.125rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  heroSubtext: {
    fontSize: '1rem',
    color: '#999',
    fontStyle: 'italic',
  },
  actionArea: {
    marginBottom: '3rem',
    textAlign: 'center',
  },
  primaryButton: {
    background: '#0070f3',
    color: 'white',
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  warning: {
    marginTop: '1rem',
    color: '#e74c3c',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  referralSection: {
    textAlign: 'center',
    padding: '2rem',
    background: '#f9f9f9',
    borderRadius: '12px',
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#333',
    marginBottom: '0.5rem',
  },
  sectionText: {
    color: '#666',
    marginBottom: '1.5rem',
  },
  secondaryButton: {
    background: '#fff',
    color: '#0070f3',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    border: '2px solid #0070f3',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  devInfo: {
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '2rem',
  },
  devTitle: {
    margin: '0 0 1rem 0',
    color: '#495057',
    fontSize: '1.1rem',
  },
  devText: {
    color: '#6c757d',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  devList: {
    color: '#6c757d',
    marginLeft: '1.5rem',
    marginBottom: '1rem',
  },
};