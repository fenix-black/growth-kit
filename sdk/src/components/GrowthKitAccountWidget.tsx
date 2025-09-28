'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { GrowthKitProvider, useGrowthKitConfig } from './GrowthKitProvider';
import { useGrowthKit } from '../useGrowthKit';
import { WaitlistForm } from './WaitlistForm';
import { CreditExhaustionModal } from './CreditExhaustionModal';
import type { CreditExhaustionModalRef } from './CreditExhaustionModal';
import type { GrowthKitConfig, GrowthKitTheme } from '../types';
import { useTranslation } from '../localization';
import { GROWTHKIT_LOGO_ICON_BASE64 } from '../assets';

// Helper function to get footer logo URL from config with theme support
const getFooterLogoUrl = (apiUrl?: string, isDark?: boolean, customUrl?: string): string => {
  if (customUrl) return customUrl;
  
  const logoFileName = isDark ? 'growthkit-logo-dark-alpha-120px.png' : 'growthkit-logo-alpha-120px.png';
  
  if (apiUrl) {
    // Remove /v1 or /api suffix and add logo file
    const baseUrl = apiUrl.replace(/\/v1$|\/api$/, '');
    return `${baseUrl}/${logoFileName}`;
  }
  
  // Fallback for development or when no apiUrl is provided
  return `https://growth.fenixblack.ai/${logoFileName}`;
};

interface GrowthKitAccountWidgetProps {
  config: GrowthKitConfig;
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  theme?: GrowthKitTheme;
  slim?: boolean;
  slim_labels?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  showCredits?: boolean;
  showLogo?: boolean;
  footerLogoUrl?: string;
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
  Omit<GrowthKitAccountWidgetProps, 'config' | 'theme'>
>(({
  children,
  position = 'top-right',
  slim = false,
  slim_labels = true,
  showName = true,
  showEmail = true,
  showCredits = true,
  showLogo = true,
  footerLogoUrl,
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
  const { config, setLanguage, themeColors, effectiveTheme } = useGrowthKitConfig();

  // Generate footer logo URL from config with theme support
  const finalFooterLogoUrl = getFooterLogoUrl(config.apiUrl, effectiveTheme === 'dark', footerLogoUrl);

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

  // Use centralized theme colors from context

  // Show loading state
  if (loading || !initialized) {
    const loadingWidget = (
      <div style={{ ...getWidgetStyles(themeColors, slim), ...style }} className={className}>
        <div style={styles.loading}>
          <div style={{ ...styles.spinner, borderTopColor: themeColors.primary }} />
          <span style={{ ...styles.loadingText, color: themeColors.textSecondary }}>{t('widget.loading')}</span>
        </div>
      </div>
    );

    return (
      <>
        {position !== 'inline' ? (
          <div style={getPositionStyles(position, slim)}>
            {loadingWidget}
          </div>
        ) : loadingWidget}
      </>
    );
  }

  // Show waitlist if required
  if (shouldShowWaitlist) {
    const waitlistWidget = (
      <div style={{ ...getWidgetStyles(themeColors, slim), ...style }} className={className}>
        <div style={styles.waitlistWidget}>
          <span style={{ ...styles.waitlistIcon, backgroundColor: `${themeColors.warning}20`, color: themeColors.warning }}>⏳</span>
          <span style={{ ...styles.waitlistText, color: themeColors.text }}>{t('widget.waitlistActive')}</span>
        </div>
      </div>
    );

    return (
      <>
        <WaitlistForm />
        {position !== 'inline' ? (
          <div style={getPositionStyles(position, slim)}>
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
        ...getWidgetStyles(themeColors, slim), 
        ...style,
        cursor: slim ? 'pointer' : 'default',
        position: position === 'inline' ? 'relative' : 'relative',
      }} 
      className={className}
      onClick={() => slim && setShowProfileExpanded(!showProfileExpanded)}
      onMouseEnter={() => setShowProfileExpanded(true)}
      onMouseLeave={() => setShowProfileExpanded(false)}
    >
      {/* Compact View */}
      <div style={slim ? styles.slimContent : styles.compactContent}>
        {/* GrowthKit Logo - only show in non-slim mode when showLogo is true */}
        {!slim && showLogo && (
          <img 
            src={GROWTHKIT_LOGO_ICON_BASE64}
            alt="GrowthKit"
            style={styles.logo}
          />
        )}
        
        {showCredits && (
          <div style={slim ? styles.slimCreditsSection : styles.creditsSection}>
            <div style={{
              ...(slim ? styles.slimCreditsIcon : styles.creditsIcon),
              background: themeColors.primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>●</div>
            <span style={{ ...(slim ? styles.slimCreditsValue : styles.creditsValue), color: themeColors.text }}>{credits}</span>
            {(!slim || slim_labels) && <span style={{ ...styles.creditsLabel, color: themeColors.textSecondary }}>{t('widget.credits')}</span>}
            {creditsPaused && (
              <div 
                style={{
                  ...(slim ? styles.slimPausedIcon : styles.pausedIcon),
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
        
{(showName || showEmail) && (!slim || slim_labels) && (
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
        
        {/* Show verification badge in slim mode when labels are hidden, but only next to credits */}
        {slim && !slim_labels && showEmail && hasClaimedEmail && hasVerifiedEmail && (
          <div style={{
            ...styles.slimVerifiedBadge,
            backgroundColor: themeColors.success + '20',
            color: themeColors.success,
          }}>✓</div>
        )}

{credits === 0 && (!slim || slim_labels) && (
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
        
        {/* Slim mode: show a tiny earn button when credits are 0 and labels are hidden */}
        {credits === 0 && slim && !slim_labels && (
          <button
            style={{ 
              ...styles.slimEarnButton, 
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
            title={t('widget.earnCredits')}
          >
            +
          </button>
        )}
      </div>

      {/* Expanded View (on hover/click) */}
      {showProfileExpanded && (
        <div style={{ 
          ...getExpandedContentStyles(position, slim), 
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
          boxShadow: themeColors.shadow,
        }}>
          <div style={styles.expandedSection}>
            <h4 style={{ ...styles.expandedTitle, color: themeColors.textSecondary }}>{t('widget.account')}</h4>
            
            {showName && (name || !slim) && (
              <div style={styles.expandedRow}>
                <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>{t('widget.name')}</span>
                <span style={{ ...styles.expandedValue, color: themeColors.text }}>
                  {name || t('widget.notSet')}
                </span>
              </div>
            )}
            
            {showEmail && (email || !slim) && (
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

          {/* Branded Footer */}
          <div style={{
            ...styles.brandedFooter,
            borderTopColor: themeColors.border,
          }}>
            <a
              href="https://growth.fenixblack.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.footerLink}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseOver={(e) => {
                // Add subtle hover effect to the text
                const text = e.currentTarget.querySelector('span');
                if (text) {
                  text.style.color = themeColors.text;
                  text.style.opacity = '1';
                }
              }}
              onMouseOut={(e) => {
                // Reset text color
                const text = e.currentTarget.querySelector('span');
                if (text) {
                  text.style.color = themeColors.textSecondary;
                  text.style.opacity = '0.8';
                }
              }}
            >
              <img 
                src={finalFooterLogoUrl}
                alt="Powered by GrowthKit"
                style={styles.footerLogo}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onError={(e) => {
                  // Fallback to a simple text if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span style={{ ...styles.footerText, color: themeColors.textSecondary }}>
                Powered by GrowthKit
              </span>
            </a>
          </div>
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
        <div style={getPositionStyles(position, slim)}>
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
>(({ config, theme, children, ...props }, ref) => {
  // If theme prop is provided, it overrides config.theme
  const effectiveConfig = theme ? { ...config, theme } : config;
  
  return (
    <GrowthKitProvider config={effectiveConfig}>
      <AccountWidgetInternal {...props} ref={ref}>
        {children}
      </AccountWidgetInternal>
    </GrowthKitProvider>
  );
});

GrowthKitAccountWidget.displayName = 'GrowthKitAccountWidget';

// Helper functions
function getPositionStyles(position: string, slim: boolean = false): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
  };

  const margin = slim ? 10 : 20;

  switch (position) {
    case 'top-left':
      return { ...baseStyles, top: margin, left: margin };
    case 'top-right':
      return { ...baseStyles, top: margin, right: margin };
    case 'bottom-left':
      return { ...baseStyles, bottom: margin, left: margin };
    case 'bottom-right':
      return { ...baseStyles, bottom: margin, right: margin };
    default:
      return baseStyles;
  }
}


function getWidgetStyles(themeColors: any, slim: boolean): React.CSSProperties {
  return {
    backgroundColor: themeColors.background,
    color: themeColors.text,
    border: `1px solid ${themeColors.border}`,
    borderRadius: slim ? '20px' : '16px',
    padding: slim ? '4px 8px' : '16px 20px',
    boxShadow: slim ? themeColors.shadowSm : themeColors.shadow,
    fontSize: slim ? '12px' : '16px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '500',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minWidth: slim ? 'auto' : '200px',
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

function getExpandedContentStyles(position: string, slim: boolean): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    borderTop: 'none',
    borderRadius: '0 0 16px 16px',
    padding: '16px 20px',
    marginTop: '2px',
    zIndex: 1001,
    backdropFilter: 'blur(8px)',
    minWidth: '200px',
  };

  // In slim mode, adjust positioning to prevent going off-screen
  if (slim) {
    const isRightSide = position.includes('right');
    const isBottomSide = position.includes('bottom');
    
    if (isRightSide) {
      // For right-side positions, make sure content doesn't overflow right
      return {
        ...baseStyles,
        left: 'auto',
        right: 0,
        top: isBottomSide ? 'auto' : '100%',
        bottom: isBottomSide ? '100%' : 'auto',
        borderRadius: isBottomSide ? '16px 16px 0 0' : '0 0 16px 16px',
        marginTop: isBottomSide ? 0 : '2px',
        marginBottom: isBottomSide ? '2px' : 0,
      };
    } else {
      // For left-side positions, anchor to left
      return {
        ...baseStyles,
        left: 0,
        right: 'auto',
        top: isBottomSide ? 'auto' : '100%',
        bottom: isBottomSide ? '100%' : 'auto',
        borderRadius: isBottomSide ? '16px 16px 0 0' : '0 0 16px 16px',
        marginTop: isBottomSide ? 0 : '2px',
        marginBottom: isBottomSide ? '2px' : 0,
      };
    }
  }

  // Normal mode - dropdown below
  return {
    ...baseStyles,
    top: '100%',
    left: 0,
    right: 0,
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
  slimContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'nowrap',
  },
  logo: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    opacity: 0.8,
    transition: 'opacity 0.2s ease',
  },
  creditsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  slimCreditsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  creditsIcon: {
    fontSize: '12px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimCreditsIcon: {
    fontSize: '8px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsValue: {
    fontWeight: '700',
    fontSize: '18px',
  },
  slimCreditsValue: {
    fontWeight: '700',
    fontSize: '14px',
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
  slimPausedIcon: {
    fontSize: '8px',
    width: '14px',
    height: '14px',
    borderRadius: '3px',
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
  slimVerifiedBadge: {
    fontSize: '8px',
    fontWeight: '700',
    width: '12px',
    height: '12px',
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
  slimEarnButton: {
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
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
  brandedFooter: {
    borderTop: '1px solid',
    paddingTop: '12px',
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  footerLink: {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footerLogo: {
    height: '28px',
    width: 'auto',
    opacity: 0.8,
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    maxWidth: '120px',
  },
  footerText: {
    fontSize: '11px',
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
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