'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { useTranslation } from '../localization';

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
  
  const { themeColors } = useGrowthKitConfig();
  const { t } = useTranslation();
  
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
    <div style={{ ...styles.overlay, backgroundColor: themeColors.overlay }} onClick={handleOverlayClick}>
      <div style={{ 
        ...styles.modal, 
        backgroundColor: themeColors.background, 
        boxShadow: themeColors.shadowLg,
        border: `1px solid ${themeColors.borderLight}`
      }}>
        <h2 style={{ 
          ...styles.title, 
          background: themeColors.primaryGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>{t('modal.earnCredits')}</h2>
        <p style={{ ...styles.subtitle, color: themeColors.textSecondary }}>
          {creditsPaused 
            ? t('modal.creditsPausedMessage')
            : t('modal.completeTasks')}
        </p>

        <div style={{ ...styles.tabs, borderBottomColor: themeColors.border }}>
          {!hasClaimedName && (
            <button 
              style={{
                ...styles.tab, 
                color: activeTab === 'name' ? themeColors.primary : themeColors.textSecondary,
                ...(activeTab === 'name' ? { 
                  ...styles.activeTab, 
                  borderBottomColor: themeColors.primary, 
                  backgroundColor: `${themeColors.primary}10` 
                } : {})
              }}
              onClick={() => setActiveTab('name')}
            >
              {t('modal.nameTab')} {!creditsPaused && `(+${policy?.nameClaimCredits || 2})`}
            </button>
          )}
          {!hasClaimedEmail && (
            <button 
              style={{
                ...styles.tab, 
                color: activeTab === 'email' ? themeColors.primary : themeColors.textSecondary,
                ...(activeTab === 'email' ? { 
                  ...styles.activeTab, 
                  borderBottomColor: themeColors.primary, 
                  backgroundColor: `${themeColors.primary}10` 
                } : {})
              }}
              onClick={() => setActiveTab('email')}
            >
              {t('modal.emailTab')} {!creditsPaused && `(+${policy?.emailClaimCredits || 2})`}
            </button>
          )}
          {hasClaimedEmail && !hasVerifiedEmail && (
            <button 
              style={{
                ...styles.tab, 
                color: activeTab === 'verify' ? themeColors.primary : themeColors.textSecondary,
                ...(activeTab === 'verify' ? { 
                  ...styles.activeTab, 
                  borderBottomColor: themeColors.primary, 
                  backgroundColor: `${themeColors.primary}10` 
                } : {})
              }}
              onClick={() => setActiveTab('verify')}
            >
              {t('modal.verifyTab')} {!creditsPaused && `(+${policy?.emailVerifyCredits || 5})`}
            </button>
          )}
          {!creditsPaused && (
            <button 
              style={{
                ...styles.tab, 
                color: activeTab === 'share' ? themeColors.primary : themeColors.textSecondary,
                ...(activeTab === 'share' ? { 
                  ...styles.activeTab, 
                  borderBottomColor: themeColors.primary, 
                  backgroundColor: `${themeColors.primary}10` 
                } : {})
              }}
              onClick={() => setActiveTab('share')}
            >
              {t('modal.shareTab')}
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
              <p>{t('modal.referralUnavailable')}</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                {t('modal.newCreditsPaused')}
              </p>
            </div>
          )}
        </div>

        <div style={{ ...styles.footer, borderTopColor: themeColors.border }}>
          <div style={{ 
            backgroundColor: `${themeColors.primary}20`, 
            padding: '12px 16px',
            borderRadius: '10px',
            border: `2px solid ${themeColors.primary}40`,
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: themeColors.textSecondary 
            }}>
              {t('modal.currentCredits')} <span style={{ color: themeColors.primary, fontWeight: '700' }}>{credits}</span>
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            style={{
              ...styles.primaryButton,
              background: themeColors.primaryGradient,
              boxShadow: themeColors.shadow,
              width: 'auto',
              minWidth: '100px',
              marginTop: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 20px 40px -5px ${themeColors.primary}80, 0 8px 16px -4px ${themeColors.primary}40`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = themeColors.shadow;
            }}
          >
            {t('modal.done')}
          </button>
        </div>
      </div>
    </div>
  );
});

CreditExhaustionModal.displayName = 'CreditExhaustionModal';

// Tab Components
function NameTab({ onClaim, loading, setLoading, credits, creditsPaused, onSuccess }: any) {
  const { t } = useTranslation();
  const { themeColors } = useGrowthKitConfig();
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
      <h3 style={{ color: themeColors.text, fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{t('modal.enterYourName')}</h3>
      <p style={{ color: themeColors.textSecondary, fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>
        {creditsPaused ? t('modal.tellUsName') : t('modal.earnCreditsName', { credits })}
      </p>
      <input 
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('modal.yourName')}
        style={{ 
          ...styles.input, 
          backgroundColor: themeColors.inputBackground,
          borderColor: themeColors.inputBorder,
          color: themeColors.text
        }}
        disabled={loading}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = themeColors.borderFocus;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.inputFocus}`;
          e.currentTarget.style.backgroundColor = themeColors.background;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = themeColors.inputBorder;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = themeColors.inputBackground;
        }}
      />
      <button 
        type="submit" 
        disabled={loading || !name.trim()}
        style={{ ...styles.primaryButton, background: themeColors.primaryGradient, boxShadow: themeColors.shadow }}
      >
        {loading ? t('modal.claiming') : t('modal.claimCredits', { credits })}
      </button>
    </form>
  );
}

function EmailTab({ onClaim, loading, setLoading, credits, creditsPaused, onSuccess }: any) {
  const { t } = useTranslation();
  const { themeColors } = useGrowthKitConfig();
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
      <h3 style={{ color: themeColors.text, fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{t('modal.enterYourEmail')}</h3>
      <p style={{ color: themeColors.textSecondary, fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>
        {creditsPaused ? t('modal.provideEmail') : t('modal.earnCreditsEmail', { credits })}
      </p>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('modal.yourEmail')}
        style={{ 
          ...styles.input, 
          backgroundColor: themeColors.inputBackground,
          borderColor: themeColors.inputBorder,
          color: themeColors.text
        }}
        disabled={loading}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = themeColors.borderFocus;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.inputFocus}`;
          e.currentTarget.style.backgroundColor = themeColors.background;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = themeColors.inputBorder;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = themeColors.inputBackground;
        }}
      />
      <button 
        type="submit" 
        disabled={loading || !email.trim()}
        style={{ ...styles.primaryButton, background: themeColors.primaryGradient, boxShadow: themeColors.shadow }}
      >
        {loading ? t('modal.claiming') : t('modal.claimCredits', { credits })}
      </button>
    </form>
  );
}

function VerifyTab({ credits, creditsPaused }: any) {
  const { t } = useTranslation();
  const { themeColors } = useGrowthKitConfig();
  
  return (
    <div>
      <h3 style={{ color: themeColors.text, fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{t('modal.verifyYourEmail')}</h3>
      <p style={{ color: themeColors.textSecondary, fontSize: '16px', fontWeight: '500', lineHeight: '1.6', marginBottom: '16px' }}>{t('modal.checkInbox')}</p>
      <div style={{ 
        backgroundColor: `${themeColors.primary}20`, 
        border: `2px solid ${themeColors.primary}40`, 
        borderRadius: '12px', 
        padding: '16px',
        marginTop: '20px'
      }}>
        <p style={{ marginTop: 0, marginBottom: 0, fontSize: '14px', color: themeColors.textSecondary, fontWeight: '500' }}>
          {creditsPaused 
            ? `✉️ ${t('modal.clickVerificationLink')}` 
            : `🎉 ${t('modal.earnVerificationCredits', { credits })}`}
        </p>
      </div>
    </div>
  );
}

function ShareTab({ referralLink, onShare, referralCredits }: any) {
  const { t } = useTranslation();
  const { themeColors } = useGrowthKitConfig();
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
      <h3 style={{ color: themeColors.text, fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{t('modal.shareAndEarn')}</h3>
      <p style={{ color: themeColors.textSecondary, fontSize: '16px', fontWeight: '500', lineHeight: '1.6', marginBottom: '20px' }}>{t('modal.earnCreditsEachFriend')}</p>
      
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
            backgroundColor: themeColors.inputBackground,
            borderColor: themeColors.inputBorder,
            color: themeColors.text,
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = themeColors.magenta;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.magenta}20`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = themeColors.inputBorder;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button 
          onClick={handleCopy} 
          style={{
            ...styles.secondaryButton,
            backgroundColor: copied ? themeColors.success : themeColors.backgroundSecondary,
            color: copied ? 'white' : themeColors.textSecondary,
            borderColor: copied ? themeColors.success : themeColors.border,
          }}
        >
          {copied ? t('modal.copied') : t('modal.copy')}
        </button>
      </div>
      
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button onClick={handleShare} style={{ ...styles.primaryButton, background: themeColors.primaryGradient, boxShadow: themeColors.shadow }}>
          {t('modal.shareNow')}
        </button>
      )}
      
      <div style={{ 
        backgroundColor: `${themeColors.magenta}20`, 
        border: `2px solid ${themeColors.magenta}40`, 
        borderRadius: '12px', 
        padding: '16px',
        marginTop: '20px'
      }}>
        <p style={{ marginTop: 0, marginBottom: 0, fontSize: '14px', color: themeColors.textSecondary, fontWeight: '600' }}>
          💫 {t('modal.earnCreditsPerReferral', { credits: referralCredits })}
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
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    padding: '32px',
    borderRadius: '20px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid', // Will be overridden by inline styles
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '16px',
    fontWeight: '500',
    lineHeight: '1.6',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid',
    padding: '0 4px',
  },
  tab: {
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
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
    borderBottomColor: 'inherit', // Will be overridden by inline styles
  },
  content: {
    minHeight: '220px',
    padding: '8px 4px',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid',
    borderRadius: '12px',
    marginTop: '16px',
    marginBottom: '16px',
    fontSize: '16px',
    fontFamily: 'inherit',
    fontWeight: '500',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  primaryButton: {
    width: '100%',
    padding: '16px 24px',
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
  },
  secondaryButton: {
    padding: '12px 24px',
    border: '2px solid',
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
    borderTop: '2px solid',
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
