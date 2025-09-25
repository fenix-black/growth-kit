'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GrowthKitProvider } from './GrowthKitProvider';
import { useGrowthKit } from '../useGrowthKit';
import { WaitlistForm } from './WaitlistForm';
import { CreditExhaustionModal } from './CreditExhaustionModal';
import type { GrowthKitConfig } from '../types';

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
    shouldShowWaitlist,
    waitlistEnabled,
    hasClaimedName,
    hasClaimedEmail,
    hasVerifiedEmail,
    refresh,
  } = useGrowthKit();

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showProfileExpanded, setShowProfileExpanded] = useState(false);
  const [prevCredits, setPrevCredits] = useState(credits);

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
      name: hasClaimedName ? 'Claimed' : undefined,
      email: hasClaimedEmail ? 'Claimed' : undefined,
      verified: hasVerifiedEmail,
    });
  }, [hasClaimedName, hasClaimedEmail, hasVerifiedEmail, onProfileChange]);

  // Auto-open credit modal when needed
  useEffect(() => {
    if (autoOpenCreditModal && credits === 0 && !loading && !waitlistEnabled) {
      setShowCreditModal(true);
    }
  }, [credits, loading, waitlistEnabled, autoOpenCreditModal]);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    openEarnCreditsModal: () => setShowCreditModal(true),
    refresh,
    getCurrentBalance: () => credits,
    getProfile: () => ({
      name: hasClaimedName ? 'Claimed' : undefined,
      email: hasClaimedEmail ? 'Claimed' : undefined,
      verified: hasVerifiedEmail,
    }),
  }));

  // Determine current theme colors
  const themeColors = getThemeColors(theme);

  // Show loading state
  if (loading || !initialized) {
    const loadingWidget = (
      <div style={{ ...getWidgetStyles(themeColors, compact), ...style }} className={className}>
        <div style={styles.loading}>
          <div style={{ ...styles.spinner, borderTopColor: themeColors.primary }} />
          <span style={{ ...styles.loadingText, color: themeColors.textSecondary }}>Loading...</span>
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
          <span style={{ ...styles.waitlistText, color: themeColors.text }}>Waitlist Active</span>
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
            <span style={styles.creditsIcon}>💰</span>
            <span style={{ ...styles.creditsValue, color: themeColors.text }}>{credits}</span>
          </div>
        )}
        
        {(showName || showEmail) && (
          <div style={styles.profileSection}>
            <span style={styles.profileIcon}>👤</span>
            {showName && hasClaimedName && (
              <span style={{ ...styles.profileText, color: themeColors.textSecondary }}>User</span>
            )}
            {showEmail && hasClaimedEmail && (
              <>
                {hasVerifiedEmail ? (
                  <span style={styles.verifiedBadge}>✅</span>
                ) : (
                  <span style={styles.unverifiedBadge}>📧</span>
                )}
              </>
            )}
          </div>
        )}

        {credits === 0 && (
          <button
            style={{ ...styles.earnButton, backgroundColor: themeColors.primary }}
            onClick={(e) => {
              e.stopPropagation();
              setShowCreditModal(true);
            }}
          >
            Earn Credits
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
            <h4 style={{ ...styles.expandedTitle, color: themeColors.textSecondary }}>Account</h4>
            
            {showName && (
              <div style={styles.expandedRow}>
                <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>Name:</span>
                <span style={{ ...styles.expandedValue, color: themeColors.text }}>
                  {hasClaimedName ? 'Claimed' : 'Not set'}
                </span>
              </div>
            )}
            
            {showEmail && (
              <div style={styles.expandedRow}>
                <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>Email:</span>
                <span style={{ ...styles.expandedValue, color: themeColors.text }}>
                  {hasClaimedEmail ? (
                    <span style={styles.expandedEmailStatus}>
                      Set {hasVerifiedEmail && <span style={styles.verifiedBadge}>✅</span>}
                    </span>
                  ) : (
                    'Not set'
                  )}
                </span>
              </div>
            )}
            
            <div style={styles.expandedRow}>
              <span style={{ ...styles.expandedLabel, color: themeColors.textSecondary }}>Credits:</span>
              <span style={{ ...styles.expandedValue, color: themeColors.text }}>{credits}</span>
            </div>
          </div>

          <button
            style={{ ...styles.expandedEarnButton, backgroundColor: themeColors.primary }}
            onClick={(e) => {
              e.stopPropagation();
              setShowCreditModal(true);
              setShowProfileExpanded(false);
            }}
          >
            Earn More Credits
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
      {showCreditModal && (
        <CreditExhaustionModal 
          onClose={() => setShowCreditModal(false)} 
        />
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
        background: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        primary: '#3b82f6',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      };
    case 'minimal':
      return {
        background: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: 'transparent',
        primary: '#3b82f6',
        shadow: 'none',
      };
    default: // light
      return {
        background: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        primary: '#3b82f6',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      };
  }
}

function getWidgetStyles(themeColors: any, compact: boolean): React.CSSProperties {
  return {
    backgroundColor: themeColors.background,
    color: themeColors.text,
    border: `1px solid ${themeColors.border}`,
    borderRadius: compact ? '8px' : '12px',
    padding: compact ? '8px 12px' : '12px 16px',
    boxShadow: themeColors.shadow,
    fontSize: compact ? '14px' : '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'all 0.2s ease',
    minWidth: compact ? 'auto' : '180px',
  };
}

// Styles object
const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
  },
  waitlistWidget: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  waitlistIcon: {
    fontSize: '16px',
  },
  waitlistText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  compactContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  creditsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  creditsIcon: {
    fontSize: '16px',
  },
  creditsValue: {
    fontWeight: '600',
    fontSize: '16px',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  profileIcon: {
    fontSize: '16px',
  },
  profileText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  verifiedBadge: {
    fontSize: '12px',
  },
  unverifiedBadge: {
    fontSize: '12px',
  },
  earnButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  expandedContent: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
    padding: '12px 16px',
    marginTop: '1px',
    zIndex: 1001,
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
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
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