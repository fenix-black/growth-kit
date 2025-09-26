'use client';

import { GrowthKitAccountWidget, useGrowthKit } from '@growthkit/sdk';
import { useState, useRef, useEffect } from 'react';
import type { GrowthKitAccountWidgetRef } from '@growthkit/sdk';

// Main App Component (now completely GrowthKit-agnostic)
function MainApp({ accountWidgetRef }: { accountWidgetRef: React.RefObject<GrowthKitAccountWidgetRef | null> }) {
  const { credits, completeAction, policy, track } = useGrowthKit();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  
  // Monitor credit changes
  useEffect(() => {
    console.log('Credits updated:', credits);
  }, [credits]);
  
  // Track page view on mount
  useEffect(() => {
    track('page_viewed', { page: 'home', path: '/' });
  }, [track]);
  
  const handleUseFeature = async () => {
    console.log('Credits before action:', credits);
    
    // Track button click
    track('button_clicked', { button: 'use-feature', section: 'main' });
    
    setIsProcessing(true);
    const success = await completeAction('generate');
    setIsProcessing(false);
    
    if (success) {
      // Note: The credits value here is still the old value due to React's closure
      // The widget will update automatically when the context updates
      console.log('Feature used successfully!');
      // Track successful feature usage
      track('feature_used', { feature: 'generate', success: true, creditsUsed: 1 });
    } else {
      console.log('Not enough credits');
      // Track failed attempt
      track('feature_used', { feature: 'generate', success: false, reason: 'no_credits' });
    }
  };

  // Test USD spending with different values
  const handleTestUsdSpending = async (action: string, usdValue: number, creditsRequired: number) => {
    console.log(`Testing ${action} - Credits: ${creditsRequired}, USD Cost: $${usdValue}`);
    
    // Track USD action attempt
    track('usd_action_started', { action, usdValue, creditsRequired });
    
    setIsProcessing(true);
    setLastAction(`${action} ($${usdValue})`);
    
    const success = await completeAction(action, { creditsRequired, usdValue });
    setIsProcessing(false);
    
    if (success) {
      console.log(`${action} completed successfully! Credits: ${creditsRequired}, USD tracked: $${usdValue}`);
      // Track successful USD action
      track('usd_action_completed', { action, usdValue, creditsRequired, success: true });
    } else {
      console.log('Not enough credits or action failed');
      // Track failed USD action
      track('usd_action_failed', { action, usdValue, creditsRequired, reason: 'insufficient_credits' });
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

      {/* USD Testing Section */}
      <div style={styles.usdTestSection}>
        <h3 style={styles.sectionTitle}>🧪 Test USD Tracking</h3>
        <p style={styles.sectionText}>
          Test credit consumption with different USD values (admin-only tracking)
        </p>
        <div style={styles.testButtonGrid}>
          <button 
            onClick={() => handleTestUsdSpending('text-generation', 0.002, 1)}
            disabled={credits < 1 || isProcessing}
            style={{
              ...styles.testActionButton,
              ...(credits < 1 || isProcessing ? styles.disabledButton : {})
            }}
          >
            Text Generation<br/>
            <small>1 credit ($0.002)</small>
          </button>
          <button 
            onClick={() => handleTestUsdSpending('image-generation', 0.15, 5)}
            disabled={credits < 5 || isProcessing}
            style={{
              ...styles.testActionButton,
              ...(credits < 5 || isProcessing ? styles.disabledButton : {})
            }}
          >
            Image Generation<br/>
            <small>5 credits ($0.15)</small>
          </button>
          <button 
            onClick={() => handleTestUsdSpending('video-processing', 1.50, 10)}
            disabled={credits < 10 || isProcessing}
            style={{
              ...styles.testActionButton,
              ...(credits < 10 || isProcessing ? styles.disabledButton : {})
            }}
          >
            Video Processing<br/>
            <small>10 credits ($1.50)</small>
          </button>
          <button 
            onClick={() => handleTestUsdSpending('api-call', 0.01, 2)}
            disabled={credits < 2 || isProcessing}
            style={{
              ...styles.testActionButton,
              ...(credits < 2 || isProcessing ? styles.disabledButton : {})
            }}
          >
            API Call<br/>
            <small>2 credits ($0.01)</small>
          </button>
        </div>
        {lastAction && (
          <p style={styles.lastActionText}>
            Last action: {lastAction} - USD value sent to backend for tracking
          </p>
        )}
      </div>

      {/* Activity Tracking Section */}
      <div style={styles.trackingSection}>
        <h3 style={styles.sectionTitle}>📊 Activity Tracking Demo</h3>
        <p style={styles.sectionText}>
          This app automatically tracks user interactions. Try these actions:
        </p>
        <div style={styles.trackingButtonGrid}>
          <button 
            onClick={() => track('demo_button_clicked', { buttonId: 'test-1', value: 'low' })}
            style={styles.trackingButton}
          >
            Track Custom Event
          </button>
          <button 
            onClick={() => track('feature_explored', { feature: 'tracking', depth: 1 })}
            style={styles.trackingButton}
          >
            Track Exploration
          </button>
          <button 
            onClick={() => {
              const startTime = Date.now();
              setTimeout(() => {
                track('time_spent', { section: 'tracking_demo', duration: Date.now() - startTime });
              }, 2000);
            }}
            style={styles.trackingButton}
          >
            Track Time (2s)
          </button>
        </div>
        <p style={styles.trackingNote}>
          Check the browser console to see tracking events being batched and sent!
        </p>
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
  trackingSection: {
    padding: '2rem',
    background: '#f0f9ff',
    borderRadius: '12px',
    marginBottom: '3rem',
  },
  trackingButtonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  trackingButton: {
    background: '#60a5fa',
    color: 'white',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  trackingNote: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '1rem',
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
  usdTestSection: {
    background: '#f0f8ff',
    border: '1px solid #b8d4e3',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
  },
  testButtonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
    marginBottom: '1rem',
  },
  testActionButton: {
    background: '#fff',
    border: '2px solid #4a90e2',
    padding: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center' as const,
  },
  lastActionText: {
    textAlign: 'center' as const,
    color: '#4a90e2',
    fontSize: '0.9rem',
    marginTop: '1rem',
    fontStyle: 'italic',
  },
};