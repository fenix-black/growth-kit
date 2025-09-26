'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGrowthKit } from '../useGrowthKit';

interface CreditExhaustionModalProps {
  // No props needed - modal manages its own state
}

export interface CreditExhaustionModalRef {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

export const CreditExhaustionModal = forwardRef<CreditExhaustionModalRef, CreditExhaustionModalProps>((props, ref) => {
  const { 
    claimName, 
    claimEmail, 
    getReferralLink,
    share,
    hasClaimedName,
    hasClaimedEmail,
    hasVerifiedEmail,
    credits,
    creditsPaused,
    policy
  } = useGrowthKit();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    !hasClaimedName ? 'name' : 
    !hasClaimedEmail ? 'email' : 
    'share'
  );
  const [loading, setLoading] = useState(false);

  // Helper function to get available tabs
  const getAvailableTabs = () => {
    const tabs = [];
    if (!hasClaimedName) tabs.push('name');
    if (!hasClaimedEmail) tabs.push('email');
    if (hasClaimedEmail && !hasVerifiedEmail) tabs.push('verify');
    tabs.push('share'); // Always available
    return tabs;
  };

  // Helper function to get next available tab
  const getNextAvailableTab = (currentTab: string) => {
    const availableTabs = getAvailableTabs();
    const currentIndex = availableTabs.indexOf(currentTab);
    
    // If current tab is still available, keep it
    if (currentIndex !== -1) return currentTab;
    
    // Otherwise return the first available tab
    return availableTabs[0] || 'share';
  };

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    isOpen: () => isOpen,
  }));

  // Update active tab when claims change
  useEffect(() => {
    setActiveTab(getNextAvailableTab(activeTab));
  }, [hasClaimedName, hasClaimedEmail, hasVerifiedEmail]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Handle click outside to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Earn Credits</h2>
        <p style={styles.subtitle}>
          {creditsPaused 
            ? 'Credit earning is temporarily paused for this app' 
            : 'Complete tasks below to earn more credits:'}
        </p>

        <div style={styles.tabs}>
          {!hasClaimedName && (
            <button 
              style={{...styles.tab, ...(activeTab === 'name' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('name')}
            >
              Name {!creditsPaused && `(+${policy?.nameClaimCredits || 2})`}
            </button>
          )}
          {!hasClaimedEmail && (
            <button 
              style={{...styles.tab, ...(activeTab === 'email' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('email')}
            >
              Email {!creditsPaused && `(+${policy?.emailClaimCredits || 2})`}
            </button>
          )}
          {hasClaimedEmail && !hasVerifiedEmail && (
            <button 
              style={{...styles.tab, ...(activeTab === 'verify' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('verify')}
            >
              Verify {!creditsPaused && `(+${policy?.emailVerifyCredits || 5})`}
            </button>
          )}
          {!creditsPaused && (
            <button 
              style={{...styles.tab, ...(activeTab === 'share' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('share')}
            >
              Share
            </button>
          )}
        </div>

        <div style={styles.content}>
          {activeTab === 'name' && !hasClaimedName && (
            <NameTab 
              onClaim={claimName} 
              loading={loading} 
              setLoading={setLoading} 
              credits={policy?.nameClaimCredits || 2}
              creditsPaused={creditsPaused}
              onSuccess={() => setActiveTab(getNextAvailableTab('name'))}
            />
          )}
          {activeTab === 'email' && !hasClaimedEmail && (
            <EmailTab 
              onClaim={claimEmail} 
              loading={loading} 
              setLoading={setLoading} 
              credits={policy?.emailClaimCredits || 2}
              creditsPaused={creditsPaused}
              onSuccess={() => setActiveTab(getNextAvailableTab('email'))}
            />
          )}
          {activeTab === 'verify' && hasClaimedEmail && !hasVerifiedEmail && (
            <VerifyTab credits={policy?.emailVerifyCredits || 5} creditsPaused={creditsPaused} />
          )}
          {activeTab === 'share' && !creditsPaused && (
            <ShareTab referralLink={getReferralLink()} onShare={share} referralCredits={policy?.referralCredits || 5} />
          )}
          {activeTab === 'share' && creditsPaused && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Referral sharing is temporarily unavailable</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                New credits are paused
              </p>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p>Current credits: {credits}</p>
          <button onClick={() => setIsOpen(false)} style={styles.primaryButton}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

CreditExhaustionModal.displayName = 'CreditExhaustionModal';

// Tab Components
function NameTab({ onClaim, loading, setLoading, credits, creditsPaused, onSuccess }: any) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    const success = await onClaim(name);
    setLoading(false);
    
    if (success) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Enter Your Name</h3>
      <p>{creditsPaused ? 'Tell us your name' : `Earn ${credits} credits by telling us your name`}</p>
      <input 
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={styles.input}
        disabled={loading}
      />
      <button 
        type="submit" 
        disabled={loading || !name.trim()}
        style={styles.primaryButton}
      >
        {loading ? 'Claiming...' : `Claim ${credits} Credits`}
      </button>
    </form>
  );
}

function EmailTab({ onClaim, loading, setLoading, credits, creditsPaused, onSuccess }: any) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    const success = await onClaim(email);
    setLoading(false);
    
    if (success) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Enter Your Email</h3>
      <p>{creditsPaused ? 'Provide your email address' : `Earn ${credits} credits + unlock email verification bonus`}</p>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={styles.input}
        disabled={loading}
      />
      <button 
        type="submit" 
        disabled={loading || !email.trim()}
        style={styles.primaryButton}
      >
        {loading ? 'Claiming...' : `Claim ${credits} Credits`}
      </button>
    </form>
  );
}

function VerifyTab({ credits, creditsPaused }: any) {
  return (
    <div>
      <h3>Verify Your Email</h3>
      <p>Check your inbox for a verification email</p>
      <p style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        {creditsPaused 
          ? 'Click the verification link to activate your account' 
          : `Click the verification link in the email to earn ${credits} additional credits`}
      </p>
    </div>
  );
}

function ShareTab({ referralLink, onShare, referralCredits }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await onShare({
      title: 'Check out this app!',
      text: 'Get free credits with my referral link!'
    });
  };

  return (
    <div>
      <h3>Share & Earn</h3>
      <p>Earn credits for each friend who joins!</p>
      
      <div style={styles.referralBox}>
        <input 
          type="text" 
          value={referralLink} 
          readOnly 
          style={styles.input}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button onClick={handleCopy} style={styles.secondaryButton}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button onClick={handleShare} style={styles.primaryButton}>
          Share Now
        </button>
      )}
      
      <p style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        You'll earn {referralCredits} credits per referral
      </p>
    </div>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '0 0 1.5rem 0',
    color: '#666',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    marginBottom: '-2px',
  },
  activeTab: {
    color: '#0070f3',
    borderBottomColor: '#0070f3',
  },
  content: {
    minHeight: '200px',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginTop: '1rem',
    marginBottom: '1rem',
    fontSize: '16px',
  },
  primaryButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralBox: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    marginBottom: '1rem',
  },
};
