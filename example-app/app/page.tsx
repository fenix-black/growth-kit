'use client';

import { GrowthKitProvider, GrowthKitGate, useGrowthKit, CreditExhaustionModal } from '@growthkit/sdk';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Main App Component (wrapped by GrowthKitGate)
function MainApp() {
  const { credits, completeAction, loading, refresh, getReferralLink, share, policy } = useGrowthKit();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  
  // Handle email verification feedback from middleware redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('verified') === 'true') {
      toast.success('Email verified successfully! +1 credit earned');
      refresh(); // Refresh credits to show the new balance
      // Clean up URL
      window.history.replaceState({}, '', '/');
    } else if (params.get('verified') === 'false') {
      const error = params.get('error');
      if (error === 'missing-token') {
        toast.error('No verification token provided');
      } else {
        toast.error('Verification failed. The token may be invalid or expired.');
      }
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [refresh]);
  
  const handleUseFeature = async () => {
    setIsProcessing(true);
    const success = await completeAction('generate');
    setIsProcessing(false);
    
    if (success) {
      toast.success('Feature used! -1 credit');
    } else {
      toast.error('Not enough credits');
    }
  };

  const handleShare = async () => {
    const success = await share();
    
    if (success) {
      toast.success('Shared successfully!');
    } else {
      toast.success('Referral message copied to clipboard!');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Example App</h1>
        <div style={styles.creditsDisplay}>
          <span>Credits: {credits}</span>
          <button 
            onClick={refresh} 
            style={styles.refreshButton}
            disabled={loading}
            aria-label="Refresh credits"
          >
            ↻
          </button>
          <button 
            onClick={() => setShowTestModal(true)} 
            style={{...styles.refreshButton, ...styles.testButton}}
            aria-label="Test credit modal"
          >
            🎯
          </button>
        </div>
      </div>

      {/* Marketing Message */}
      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>Welcome to Example App</h2>
        <p style={styles.heroText}>Each action uses 1 credit. You get 3 free credits daily!</p>
        <p style={styles.heroSubtext}>Visit daily to claim your credits</p>
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
            Out of credits! Complete tasks in the modal to earn more.
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
          onClick={handleShare}
          style={styles.secondaryButton}
        >
          Share Referral Link
        </button>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <CreditExhaustionModal 
          onClose={() => setShowTestModal(false)} 
          forceOpen={true}
        />
      )}
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || '',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`,
    debug: process.env.NODE_ENV === 'development',
  };

  return (
    <GrowthKitProvider config={config}>
      <GrowthKitGate>
        <MainApp />
      </GrowthKitGate>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </GrowthKitProvider>
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
  creditsDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#f0f0f0',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  refreshButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  testButton: {
    background: '#f0f0f0',
    border: '1px solid #ccc',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'all 0.2s',
    marginLeft: '0.25rem',
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
};