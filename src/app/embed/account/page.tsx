'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GrowthKitProvider } from '../../../../sdk/src/components/GrowthKitProvider';
import { useGrowthKit } from '../../../../sdk/src/useGrowthKit';
import { useGrowthKitConfig } from '../../../../sdk/src/components/GrowthKitProvider';
import { CreditExhaustionModal } from '../../../../sdk/src/components/CreditExhaustionModal';
import type { CreditExhaustionModalRef } from '../../../../sdk/src/components/CreditExhaustionModal';
import { useTranslation } from '../../../../sdk/src/localization';
import type { GrowthKitConfig, GrowthKitTheme } from '../../../../sdk/src/types';

/**
 * Embedded Account Widget Page
 * 
 * URL Parameters:
 * - pk: Public key (required)
 * - theme: 'light' | 'dark' | 'auto' (default: 'auto')
 * - lang: 'en' | 'es' (default: 'en')
 * - slim: 'true' | 'false' (default: 'false')
 * - showName: 'true' | 'false' (default: 'true')
 * - showEmail: 'true' | 'false' (default: 'true')
 * - showCredits: 'true' | 'false' (default: 'true')
 * 
 * Example:
 * /embed/account?pk=pk_xxx&theme=dark&lang=es&slim=true
 */

// Internal component that uses the GrowthKit context
function AccountWidgetInternal({ 
  slim, 
  showName, 
  showEmail, 
  showCredits 
}: { 
  slim: boolean;
  showName: boolean;
  showEmail: boolean;
  showCredits: boolean;
}) {
  const {
    loading,
    initialized,
    error,
    credits,
    creditsPaused,
    name,
    hasClaimedEmail,
    hasVerifiedEmail,
  } = useGrowthKit();

  const { t } = useTranslation();
  const { themeColors } = useGrowthKitConfig();
  const creditModalRef = React.useRef<CreditExhaustionModalRef>(null);
  const [showExpanded, setShowExpanded] = useState(false);

  // Send events to parent
  useEffect(() => {
    if (initialized && !loading) {
      window.parent.postMessage({
        type: 'growthkit:account:ready',
        data: { credits, name, hasVerifiedEmail },
      }, '*');
    }
  }, [initialized, loading, credits, name, hasVerifiedEmail]);

  useEffect(() => {
    window.parent.postMessage({
      type: 'growthkit:credits:updated',
      data: { credits },
    }, '*');
  }, [credits]);

  // Loading state
  if (loading || !initialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: slim ? '6px 12px' : '12px 16px',
        backgroundColor: themeColors.background,
        borderRadius: slim ? '20px' : '12px',
        border: `1px solid ${themeColors.border}`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          width: '14px',
          height: '14px',
          border: `2px solid ${themeColors.border}`,
          borderTopColor: themeColors.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ color: themeColors.textSecondary, fontSize: '13px' }}>
          {t('widget.loading')}
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        padding: slim ? '6px 12px' : '12px 16px',
        backgroundColor: themeColors.background,
        borderRadius: slim ? '20px' : '12px',
        border: `1px solid ${themeColors.border}`,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: themeColors.warning,
        fontSize: '13px',
      }}>
        ⚠ {t('widget.errorMinimal')}
      </div>
    );
  }

  return (
    <>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: slim ? '8px' : '12px',
          padding: slim ? '6px 12px' : '12px 16px',
          backgroundColor: themeColors.background,
          borderRadius: slim ? '20px' : '12px',
          border: `1px solid ${themeColors.border}`,
          fontFamily: 'Inter, system-ui, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={() => setShowExpanded(true)}
        onMouseLeave={() => setShowExpanded(false)}
      >
        {/* Credits */}
        {showCredits && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: slim ? '10px' : '12px',
              background: themeColors.primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: '900',
            }}>●</span>
            <span style={{ 
              fontWeight: '700', 
              fontSize: slim ? '14px' : '16px',
              color: themeColors.text,
            }}>
              {credits}
            </span>
            {!slim && (
              <span style={{ 
                color: themeColors.textSecondary, 
                fontSize: '13px' 
              }}>
                {t('widget.credits')}
              </span>
            )}
            {creditsPaused && (
              <span 
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  backgroundColor: themeColors.warning + '20',
                  color: themeColors.warning,
                  borderRadius: '4px',
                }}
                title={t('widget.creditsPausedTooltip')}
              >
                ⏸
              </span>
            )}
          </div>
        )}

        {/* Name/Email indicator */}
        {(showName || showEmail) && !slim && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showName && name && (
              <span style={{ 
                color: themeColors.textSecondary, 
                fontSize: '13px',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {name}
              </span>
            )}
            {showEmail && hasClaimedEmail && hasVerifiedEmail && (
              <span style={{
                fontSize: '10px',
                width: '16px',
                height: '16px',
                backgroundColor: themeColors.success + '20',
                color: themeColors.success,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                ✓
              </span>
            )}
          </div>
        )}

        {/* Earn button when 0 credits */}
        {credits === 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              creditModalRef.current?.open();
            }}
            style={{
              background: themeColors.primaryGradient,
              color: 'white',
              border: 'none',
              borderRadius: slim ? '12px' : '8px',
              padding: slim ? '4px 10px' : '6px 12px',
              fontSize: slim ? '11px' : '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
          >
            {slim ? '+' : t('widget.earnCredits')}
          </button>
        )}

        {/* Expanded panel on hover */}
        {showExpanded && !slim && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            padding: '12px 16px',
            backgroundColor: themeColors.background,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '12px',
            boxShadow: themeColors.shadow,
            zIndex: 100,
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}>
                <span style={{ color: themeColors.textSecondary, fontSize: '13px' }}>
                  {t('widget.name')}
                </span>
                <span style={{ color: themeColors.text, fontSize: '13px', fontWeight: '500' }}>
                  {name || t('widget.notSet')}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
              }}>
                <span style={{ color: themeColors.textSecondary, fontSize: '13px' }}>
                  {t('widget.creditsLabel')}
                </span>
                <span style={{ color: themeColors.text, fontSize: '13px', fontWeight: '500' }}>
                  {credits}
                </span>
              </div>
            </div>
            <button
              onClick={() => creditModalRef.current?.open()}
              style={{
                width: '100%',
                background: themeColors.primaryGradient,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {t('widget.earnMoreCredits')}
            </button>
          </div>
        )}
      </div>

      <CreditExhaustionModal ref={creditModalRef} />
    </>
  );
}

export default function EmbedAccountPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<GrowthKitConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState({
    slim: false,
    showName: true,
    showEmail: true,
    showCredits: true,
  });

  useEffect(() => {
    const publicKey = searchParams.get('pk');
    const theme = (searchParams.get('theme') as GrowthKitTheme) || 'auto';
    const language = (searchParams.get('lang') as 'en' | 'es') || 'en';
    
    if (!publicKey) {
      setError('Missing public key. Add ?pk=your_public_key to the URL.');
      return;
    }

    if (!publicKey.startsWith('pk_')) {
      setError('Invalid public key format. Public keys must start with "pk_".');
      return;
    }

    setOptions({
      slim: searchParams.get('slim') === 'true',
      showName: searchParams.get('showName') !== 'false',
      showEmail: searchParams.get('showEmail') !== 'false',
      showCredits: searchParams.get('showCredits') !== 'false',
    });
    
    setConfig({
      publicKey,
      theme,
      language,
      apiUrl: 'https://growth.fenixblack.ai/api',
    });
  }, [searchParams]);

  // Error state
  if (error) {
    return (
      <div style={{
        padding: '12px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        fontSize: '13px',
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  // Loading state
  if (!config) {
    return (
      <div style={{
        padding: '12px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '14px',
          height: '14px',
          border: '2px solid #e5e7eb',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        Loading...
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px' }}>
      <GrowthKitProvider config={config}>
        <AccountWidgetInternal {...options} />
      </GrowthKitProvider>
    </div>
  );
}

