'use client';

import React, { useState, useEffect } from 'react';
import { useGrowthKit } from '../useGrowthKit';

interface CreditExhaustionModalProps {
  onClose: () => void;
  forceOpen?: boolean; // When true, disables auto-close behavior for testing
}

export function CreditExhaustionModal({ onClose, forceOpen = false }: CreditExhaustionModalProps) {
  const { 
    claimName, 
    claimEmail, 
    getReferralLink,
    share,
    hasClaimedName,
    hasClaimedEmail,
    hasVerifiedEmail,
    credits,
    policy
  } = useGrowthKit();
  
  const [activeTab, setActiveTab] = useState(
    !hasClaimedName ? 'name' : 
    !hasClaimedEmail ? 'email' : 
    'share'
  );
  const [loading, setLoading] = useState(false);

  // Auto-close if credits are restored (unless forceOpen is true)
  useEffect(() => {
    if (credits > 0 && !forceOpen) {
      onClose();
    }
  }, [credits, onClose, forceOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Handle click outside to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{forceOpen ? 'Credit Earning Options' : 'Out of Credits!'}</h2>
        <p style={styles.subtitle}>Complete tasks below to earn more credits:</p>

        <div style={styles.tabs}>
          {!hasClaimedName && (
            <button 
              style={{...styles.tab, ...(activeTab === 'name' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('name')}
            >
              Name (+{policy?.nameClaimCredits || 2})
            </button>
          )}
          {!hasClaimedEmail && (
            <button 
              style={{...styles.tab, ...(activeTab === 'email' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('email')}
            >
              Email (+{policy?.emailClaimCredits || 2})
            </button>
          )}
          {hasClaimedEmail && !hasVerifiedEmail && (
            <button 
              style={{...styles.tab, ...(activeTab === 'verify' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('verify')}
            >
              Verify (+{policy?.emailVerifyCredits || 5})
            </button>
          )}
          <button 
            style={{...styles.tab, ...(activeTab === 'share' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('share')}
          >
            Share
          </button>
        </div>

        <div style={styles.content}>
          {activeTab === 'name' && !hasClaimedName && (
            <NameTab onClaim={claimName} loading={loading} setLoading={setLoading} credits={policy?.nameClaimCredits || 2} />
          )}
          {activeTab === 'email' && !hasClaimedEmail && (
            <EmailTab onClaim={claimEmail} loading={loading} setLoading={setLoading} credits={policy?.emailClaimCredits || 2} />
          )}
          {activeTab === 'verify' && hasClaimedEmail && !hasVerifiedEmail && (
            <VerifyTab credits={policy?.emailVerifyCredits || 5} />
          )}
          {activeTab === 'share' && (
            <ShareTab referralLink={getReferralLink()} onShare={share} referralCredits={policy?.referralCredits || 5} />
          )}
        </div>

        <div style={styles.footer}>
          <p>Current credits: {credits}</p>
          {credits > 0 && !forceOpen && (
            <button onClick={onClose} style={styles.primaryButton}>
              Continue
            </button>
          )}
          {forceOpen && (
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
              Press ESC or click outside to close
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Tab Components
function NameTab({ onClaim, loading, setLoading, credits }: any) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    const success = await onClaim(name);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Enter Your Name</h3>
      <p>Earn {credits} credits by telling us your name</p>
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

function EmailTab({ onClaim, loading, setLoading, credits }: any) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    const success = await onClaim(email);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Enter Your Email</h3>
      <p>Earn {credits} credits + unlock email verification bonus</p>
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

function VerifyTab({ credits }: any) {
  return (
    <div>
      <h3>Verify Your Email</h3>
      <p>Check your inbox for a verification email</p>
      <p style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        Click the verification link in the email to earn {credits} additional credits
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
