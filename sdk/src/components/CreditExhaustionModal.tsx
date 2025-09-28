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
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            padding: '12px 16px',
            borderRadius: '10px',
            border: '2px solid rgba(16, 185, 129, 0.2)',
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#64748b' 
            }}>
              Current credits: <span style={{ color: '#10b981', fontWeight: '700' }}>{credits}</span>
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            style={{
              ...styles.primaryButton,
              width: 'auto',
              minWidth: '100px',
              marginTop: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(16, 185, 129, 0.5), 0 8px 16px -4px rgba(16, 185, 129, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.1)';
            }}
          >
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
      <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Enter Your Name</h3>
      <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>
        {creditsPaused ? 'Tell us your name' : `Earn ${credits} credits by telling us your name`}
      </p>
      <input 
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={styles.input}
        disabled={loading}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#10b981';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        }}
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
      <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Enter Your Email</h3>
      <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>
        {creditsPaused ? 'Provide your email address' : `Earn ${credits} credits + unlock email verification bonus`}
      </p>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={styles.input}
        disabled={loading}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#10b981';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        }}
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
      <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Verify Your Email</h3>
      <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500', lineHeight: '1.6', marginBottom: '16px' }}>Check your inbox for a verification email</p>
      <div style={{ 
        backgroundColor: 'rgba(16, 185, 129, 0.1)', 
        border: '2px solid rgba(16, 185, 129, 0.2)', 
        borderRadius: '12px', 
        padding: '16px',
        marginTop: '20px'
      }}>
        <p style={{ marginTop: 0, marginBottom: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
          {creditsPaused 
            ? '✉️ Click the verification link to activate your account' 
            : `🎉 Click the verification link in the email to earn ${credits} additional credits`}
        </p>
      </div>
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
      <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Share & Earn</h3>
      <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500', lineHeight: '1.6', marginBottom: '20px' }}>Earn credits for each friend who joins!</p>
      
      <div style={styles.referralBox}>
        <input 
          type="text" 
          value={referralLink} 
          readOnly 
          style={{
            ...styles.input,
            marginTop: 0,
            marginBottom: 0,
            flexGrow: 1,
            cursor: 'pointer',
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#d946ef';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(217, 70, 239, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button 
          onClick={handleCopy} 
          style={{
            ...styles.secondaryButton,
            backgroundColor: copied ? '#10b981' : '#f1f5f9',
            color: copied ? 'white' : '#475569',
            borderColor: copied ? '#10b981' : '#e2e8f0',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button onClick={handleShare} style={styles.primaryButton}>
          Share Now
        </button>
      )}
      
      <div style={{ 
        backgroundColor: 'rgba(217, 70, 239, 0.1)', 
        border: '2px solid rgba(217, 70, 239, 0.2)', 
        borderRadius: '12px', 
        padding: '16px',
        marginTop: '20px'
      }}>
        <p style={{ marginTop: 0, marginBottom: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
          💫 You'll earn {referralCredits} credits per referral
        </p>
      </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '20px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    margin: '0 0 24px 0',
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '500',
    lineHeight: '1.6',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e2e8f0',
    padding: '0 4px',
  },
  tab: {
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    marginBottom: '-2px',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  activeTab: {
    color: '#10b981',
    borderBottomColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  content: {
    minHeight: '220px',
    padding: '8px 4px',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    marginTop: '16px',
    marginBottom: '16px',
    fontSize: '16px',
    fontFamily: 'inherit',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  primaryButton: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    letterSpacing: '0.025em',
    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '2px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  referralBox: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    marginBottom: '16px',
  },
};
