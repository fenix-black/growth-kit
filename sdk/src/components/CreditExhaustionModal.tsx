'use client';

import React, { useState, useEffect } from 'react';
import { useGrowthKit } from '../useGrowthKit';

interface CreditExhaustionModalProps {
  onClose: () => void;
}

export function CreditExhaustionModal({ onClose }: CreditExhaustionModalProps) {
  const { 
    claimName, 
    claimEmail, 
    getReferralLink,
    share,
    hasClaimedName,
    hasClaimedEmail,
    hasVerifiedEmail,
    credits
  } = useGrowthKit();
  
  const [activeTab, setActiveTab] = useState(
    !hasClaimedName ? 'name' : 
    !hasClaimedEmail ? 'email' : 
    'share'
  );
  const [loading, setLoading] = useState(false);

  // Auto-close if credits are restored
  useEffect(() => {
    if (credits > 0) {
      onClose();
    }
  }, [credits, onClose]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Out of Credits!</h2>
        <p style={styles.subtitle}>Complete tasks below to earn more credits:</p>

        <div style={styles.tabs}>
          {!hasClaimedName && (
            <button 
              style={{...styles.tab, ...(activeTab === 'name' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('name')}
            >
              Name (+1)
            </button>
          )}
          {!hasClaimedEmail && (
            <button 
              style={{...styles.tab, ...(activeTab === 'email' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('email')}
            >
              Email (+1)
            </button>
          )}
          {hasClaimedEmail && !hasVerifiedEmail && (
            <button 
              style={{...styles.tab, ...(activeTab === 'verify' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('verify')}
            >
              Verify (+1)
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
            <NameTab onClaim={claimName} loading={loading} setLoading={setLoading} />
          )}
          {activeTab === 'email' && !hasClaimedEmail && (
            <EmailTab onClaim={claimEmail} loading={loading} setLoading={setLoading} />
          )}
          {activeTab === 'verify' && hasClaimedEmail && !hasVerifiedEmail && (
            <VerifyTab />
          )}
          {activeTab === 'share' && (
            <ShareTab referralLink={getReferralLink()} onShare={share} />
          )}
        </div>

        <div style={styles.footer}>
          <p>Current credits: {credits}</p>
          {credits > 0 && (
            <button onClick={onClose} style={styles.primaryButton}>
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tab Components
function NameTab({ onClaim, loading, setLoading }: any) {
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
      <p>Earn 1 credit by telling us your name</p>
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
        {loading ? 'Claiming...' : 'Claim 1 Credit'}
      </button>
    </form>
  );
}

function EmailTab({ onClaim, loading, setLoading }: any) {
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
      <p>Earn 1 credit + unlock email verification bonus</p>
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
        {loading ? 'Claiming...' : 'Claim 1 Credit'}
      </button>
    </form>
  );
}

function VerifyTab() {
  return (
    <div>
      <h3>Verify Your Email</h3>
      <p>Check your inbox for a verification email</p>
      <p style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        Click the verification link in the email to earn 1 additional credit
      </p>
    </div>
  );
}

function ShareTab({ referralLink, onShare }: any) {
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
        You'll earn 3 credits per referral
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
    borderBottom: '2px solid transparent',
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
