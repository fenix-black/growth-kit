'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { GrowthKitProvider, useGrowthKitConfig } from './GrowthKitProvider';
import { useGrowthKit } from '../useGrowthKit';
import { WaitlistForm } from './WaitlistForm';
import { CreditExhaustionModal } from './CreditExhaustionModal';
import type { CreditExhaustionModalRef } from './CreditExhaustionModal';
import type { GrowthKitConfig } from '../types';
import { useTranslation } from '../localization';

interface GrowthKitAccountWidgetProps {
  config: GrowthKitConfig;
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  theme?: 'light' | 'dark' | 'minimal' | 'auto';
  compact?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  showCredits?: boolean;
  autoOpenCreditModal?: boolean;
  onCreditsChange?: (credits: number) => void;
  onProfileChange?: (profile: { name?: string; email?: string; verified?: boolean }) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface GrowthKitAccountWidgetRef {
  openEarnCreditsModal: () => void;
  refresh: () => Promise<void>;
  getCurrentBalance: () => number;
  getProfile: () => { name?: string; email?: string; verified?: boolean };
  setLanguage: (language: 'en' | 'es') => void;
}

// Internal widget component that uses the context
const AccountWidgetInternal = forwardRef<
  GrowthKitAccountWidgetRef,
  Omit<GrowthKitAccountWidgetProps, 'config'>
>(({
  children,
  position = 'top-right',
  theme = 'auto',
  compact = false,
  showName = true,
  showEmail = true,
  showCredits = true,
  autoOpenCreditModal = true,
  onCreditsChange,
  onProfileChange,
  className,
  style,
}, ref) => {
  const {
    loading,
    initialized,
    credits,
    creditsPaused,
    shouldShowWaitlist,
    waitlistEnabled,
    name,
    email,
    hasClaimedName,
    hasClaimedEmail,
    hasVerifiedEmail,
    refresh,
  } = useGrowthKit();

  const { t } = useTranslation();
  const { setLanguage } = useGrowthKitConfig();

  const creditModalRef = useRef<CreditExhaustionModalRef>(null);
  const [showProfileExpanded, setShowProfileExpanded] = useState(false);
  const [prevCredits, setPrevCredits] = useState(credits);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Track credits changes
  useEffect(() => {
    if (credits !== prevCredits) {
      onCreditsChange?.(credits);
      setPrevCredits(credits);
    }
  }, [credits, prevCredits, onCreditsChange]);

  // Track profile changes
  useEffect(() => {
    onProfileChange?.({
      name: name || undefined,
      email: email || undefined,
      verified: hasVerifiedEmail,
    });
  }, [name, email, hasVerifiedEmail, onProfileChange]);

  // Auto-open credit modal when needed
  useEffect(() => {
    if (autoOpenCreditModal && credits === 0 && !loading && !waitlistEnabled) {
      creditModalRef.current?.open();
    }
  }, [credits, loading, waitlistEnabled, autoOpenCreditModal]);

  // Handle email verification feedback from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('verified') === 'true') {
      showNotification(t('widget.emailVerifiedSuccess'), 'success');
      refresh();
      cleanupUrl();
    } else if (params.get('verified') === 'false') {
      const error = params.get('error');
      const message = error === 'missing-token' 
        ? t('widget.noVerificationToken')
        : t('widget.verificationFailed');
      showNotification(message, 'error');
      cleanupUrl();
    }
  }, [refresh]);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Clean up URL parameters
  const cleanupUrl = () => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    openEarnCreditsModal: () => creditModalRef.current?.open(),
    refresh,
    getCurrentBalance: () => credits,
    getProfile: () => ({
      name: name || undefined,
      email: email || undefined,
      verified: hasVerifiedEmail,
    }),
    setLanguage: setLanguage || (() => {}),
  }));

  // Determine current theme colors
  const themeColors = getThemeColors(theme);

  // Show loading state
  if (loading || !initialized) {
    const loadingWidget = (
      <div style={{ ...getWidgetStyles(themeColors, compact), ...style }} className={className}>
        <div style={styles.loading}>
          <div style={{ ...styles.spinner, borderTopColor: themeColors.primary }} />
          <span style={{ ...styles.loadingText, color: themeColors.textSecondary }}>{t('widget.loading')}</span>
        </div>
      </div>
    );

    return (
      <>
        {position !== 'inline' ? (
          <div style={getPositionStyles(position)}>
            {loadingWidget}
          </div>
        ) : loadingWidget}
      </>
    );
  }

  // Show waitlist if required
  if (shouldShowWaitlist) {
    const waitlistWidget = (
      <div style={{ ...getWidgetStyles(themeColors, compact), ...style }} className={className}>
        <div style={styles.waitlistWidget}>
          <span style={styles.waitlistIcon}>⏳</span>
          <span style={{ ...styles.waitlistText, color: themeColors.text }}>{t('widget.waitlistActive')}</span>
        </div>
      </div>
    );

    return (
      <>
        <WaitlistForm />
        {position !== 'inline' ? (
          <div style={getPositionStyles(position)}>
            {waitlistWidget}
          </div>
        ) : waitlistWidget}
      </>
    );
  }

  // Main widget content
  const mainWidget = (
    <div 
      style={{ 
        ...getWidgetStyles(themeColors, compact), 
        ...style,
        cursor: compact ? 'pointer' : 'default',
        position: position === 'inline' ? 'relative' : 'relative',
      }} 
      className={className}
      onClick={() => compact && setShowProfileExpanded(!showProfileExpanded)}
      onMouseEnter={() => !compact && setShowProfileExpanded(true)}
      onMouseLeave={() => !compact && setShowProfileExpanded(false)}
    >
      {/* Compact View */}
      <div style={styles.compactContent}>
        {showCredits && (
          <div style={styles.creditsSection}>
            <div style={{
              ...styles.creditsIcon,
              background: themeColors.primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>●</div>
            <span style={{ ...styles.creditsValue, color: themeColors.text }}>{credits}</span>
            <span style={{ ...styles.creditsLabel, color: themeColors.textSecondary }}>{t('widget.credits')}</span>
            {creditsPaused && (
              <div 
                style={{
                  ...styles.pausedIcon,
                  backgroundColor: themeColors.warning + '20',
                  color: themeColors.warning,
                }} 
                title={t('widget.creditsPausedTooltip')}
              >
                ⏸
              </div>
            )}
          </div>
        )}
        
        {(showName || showEmail) && (
          <div style={styles.profileSection}>
            <div style={{
              ...styles.profileIcon,
              backgroundColor: themeColors.accent + '20',
              color: themeColors.accent,
            }}>●</div>
            {showName && name && (
              <span style={{ ...styles.profileText, color: themeColors.textSecondary }}>{name}</span>
            )}
            {showEmail && hasClaimedEmail && (
              <>
                {hasVerifiedEmail ? (
                  <div style={{
                    ...styles.verifiedBadge,
                    backgroundColor: themeColors.success + '20',
                    color: themeColors.success,
                  }}>✓</div>
                ) : (
                  <div style={{
                    ...styles.unverifiedBadge,
                    backgroundColor: themeColors.warning + '20',
                    color: themeColors.warning,
                  }}>!</div>
                )}
              </>
            )}
          </div>
        )}

        {credits === 0 && (
          <button
            style={{ 
              ...styles.earnButton, 
              background: themeColors.primaryGradient,
              boxShadow: themeColors.shadowSm,
            }}
            onClick={(e) => {
              e.stopPropagation();
              creditModalRef.current?.open();
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = themeColors.shadow;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = themeColors.shadowSm;
            }}
          >
            {t('widget.earnCredits')}
          </button>
        )}
      </div>

      {/* Expanded View (on hover/click) */}
      {showProfileExpanded && !compact && (
        <div style={{ 
          ...styles.expandedContent, 
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
          boxShadow: themeColors.shadow,
        }}>
          <div style={styles.expandedSection}>
            <h4 style={{ ...styles.expandedTitle, color: themeColors.textSecondary }}>{t('widget.account')}</h4>
            
            {showName && (
              <div style={styles.expandedRow}>
                <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>{t('widget.name')}</span>
                <span style={{ ...styles.expandedValue, color: themeColors.text }}>
                  {name || t('widget.notSet')}
                </span>
              </div>
            )}
            
            {showEmail && (
              <div style={styles.expandedRow}>
                <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>{t('widget.email')}</span>
                <span style={{ ...styles.expandedValue, color: themeColors.text }}>
                  {email ? (
                    <span style={styles.expandedEmailStatus}>
                      {email} {hasVerifiedEmail && <span style={styles.verifiedBadge}>✅</span>}
                    </span>
                  ) : (
                    t('widget.notSet')
                  )}
                </span>
              </div>
            )}
            
            <div style={styles.expandedRow}>
              <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>{t('widget.creditsLabel')}</span>
              <span style={{ ...styles.expandedValue, color: themeColors.text }}>{credits}</span>
            </div>
          </div>

          <button
            style={{ 
              ...styles.expandedEarnButton, 
              background: themeColors.primaryGradient,
              boxShadow: themeColors.shadowSm,
            }}
            onClick={(e) => {
              e.stopPropagation();
              creditModalRef.current?.open();
              setShowProfileExpanded(false);
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = themeColors.shadow;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = themeColors.shadowSm;
            }}
          >
            {t('widget.earnMoreCredits')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Render widget */}
      {position === 'inline' ? (
        mainWidget
      ) : (
        <div style={getPositionStyles(position)}>
          {mainWidget}
        </div>
      )}

      {/* Render children (app content) */}
      {children}

      {/* Credit modal */}
      <CreditExhaustionModal ref={creditModalRef} />

      {/* Internal notifications */}
      {notification && (
        <div style={{
          ...getPositionStyles(position === 'inline' ? 'top-right' : position),
          ...getNotificationStyles(themeColors, notification.type),
          ...(position === 'inline' ? { position: 'absolute', top: '-60px' } : { marginTop: '10px' })
        }}>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            style={styles.notificationClose}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
});

AccountWidgetInternal.displayName = 'AccountWidgetInternal';

// Main exported component with Provider wrapper
export const GrowthKitAccountWidget = forwardRef<
  GrowthKitAccountWidgetRef,
  GrowthKitAccountWidgetProps
>(({ config, children, ...props }, ref) => {
  return (
    <GrowthKitProvider config={config}>
      <AccountWidgetInternal {...props} ref={ref}>
        {children}
      </AccountWidgetInternal>
    </GrowthKitProvider>
  );
});

GrowthKitAccountWidget.displayName = 'GrowthKitAccountWidget';

// Helper functions
function getPositionStyles(position: string): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
  };

  switch (position) {
    case 'top-left':
      return { ...baseStyles, top: 20, left: 20 };
    case 'top-right':
      return { ...baseStyles, top: 20, right: 20 };
    case 'bottom-left':
      return { ...baseStyles, bottom: 20, left: 20 };
    case 'bottom-right':
      return { ...baseStyles, bottom: 20, right: 20 };
    default:
      return baseStyles;
  }
}

function getThemeColors(theme: string) {
  // Auto-detect system theme if needed
  const effectiveTheme = theme === 'auto' 
    ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  switch (effectiveTheme) {
    case 'dark':
      return {
        background: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#334155',
        primary: '#10b981',
        primaryGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
        accent: '#d946ef',
        success: '#10b981',
        warning: '#f97316',
        shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        shadowSm: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      };
    case 'minimal':
      return {
        background: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: 'transparent',
        primary: '#10b981',
        primaryGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
        accent: '#d946ef',
        success: '#10b981',
        warning: '#f97316',
        shadow: 'none',
        shadowSm: 'none',
      };
    default: // light
      return {
        background: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        primary: '#10b981',
        primaryGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
        accent: '#d946ef',
        success: '#10b981',
        warning: '#f97316',
        shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        shadowSm: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      };
  }
}

function getWidgetStyles(themeColors: any, compact: boolean): React.CSSProperties {
  return {
    backgroundColor: themeColors.background,
    color: themeColors.text,
    border: themeColors.border === 'transparent' ? 'none' : `1px solid ${themeColors.border}`,
    borderRadius: compact ? '12px' : '16px',
    padding: compact ? '12px 16px' : '16px 20px',
    boxShadow: themeColors.shadow,
    fontSize: compact ? '14px' : '16px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '500',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minWidth: compact ? 'auto' : '200px',
    backdropFilter: 'blur(8px)',
  };
}

function getNotificationStyles(themeColors: any, type: 'success' | 'error'): React.CSSProperties {
  return {
    background: type === 'success' 
      ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' 
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: themeColors.shadow,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 1002,
    border: 'none',
    backdropFilter: 'blur(8px)',
  };
}

// Styles object
const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  waitlistWidget: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  waitlistIcon: {
    fontSize: '20px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    backgroundColor: '#f97316' + '20',
    color: '#f97316',
  },
  waitlistText: {
    fontSize: '14px',
    fontWeight: '600',
  },
  compactContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  creditsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  creditsIcon: {
    fontSize: '12px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsValue: {
    fontWeight: '700',
    fontSize: '18px',
  },
  creditsLabel: {
    fontSize: '13px',
    fontWeight: '500',
  },
  pausedIcon: {
    fontSize: '12px',
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'help',
    fontWeight: '600',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  profileIcon: {
    fontSize: '8px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
  },
  profileText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  verifiedBadge: {
    fontSize: '10px',
    fontWeight: '700',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unverifiedBadge: {
    fontSize: '10px',
    fontWeight: '700',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnButton: {
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.025em',
  },
  expandedContent: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderTop: 'none',
    borderRadius: '0 0 16px 16px',
    padding: '16px 20px',
    marginTop: '2px',
    zIndex: 1001,
    backdropFilter: 'blur(8px)',
  },
  expandedSection: {
    marginBottom: '12px',
  },
  expandedTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600',
  },
  expandedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  expandedLabel: {
    fontSize: '14px',
  },
  expandedValue: {
    fontSize: '14px',
    fontWeight: '500',
  },
  expandedEmailStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  expandedEarnButton: {
    width: '100%',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.025em',
  },
  notificationClose: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Add CSS animation for spinner (only in browser)
if (typeof document !== 'undefined' && !document.getElementById('growthkit-spinner-styles')) {
  const spinnerStyle = document.createElement('style');
  spinnerStyle.id = 'growthkit-spinner-styles';
  spinnerStyle.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinnerStyle);
}