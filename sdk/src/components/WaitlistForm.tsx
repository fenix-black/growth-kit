'use client';

import React, { useState, FormEvent } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { useTranslation, interpolate } from '../localization';

export interface WaitlistFormProps {
  message?: string;
  onSuccess?: (position: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Default waitlist form component
 * 
 * @example
 * ```tsx
 * <WaitlistForm message="Join our exclusive waitlist!" />
 * ```
 */
export function WaitlistForm({ 
  message,
  onSuccess,
  className,
  style 
}: WaitlistFormProps) {
  const growthKit = useGrowthKit();
  const { themeColors } = useGrowthKitConfig();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(t('waitlist.emailRequired'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('waitlist.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await growthKit.joinWaitlist(email);
      
      if (success) {
        // Refresh to get position
        await growthKit.refresh();
        const newPosition = growthKit.waitlistPosition || 0;
        setPosition(newPosition);
        
        if (onSuccess) {
          onSuccess(newPosition);
        }
      } else {
        setError(t('waitlist.joinFailed'));
      }
    } catch (err) {
      setError(t('waitlist.errorOccurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already on waitlist, show position
  if (position !== null || growthKit.waitlistStatus === 'waiting') {
    const displayPosition = position || growthKit.waitlistPosition || 0;
    
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          background: themeColors.primaryGradient,
          ...style
        }}
      >
        <div style={{
          textAlign: 'center',
          padding: '48px',
          maxWidth: '520px',
          background: themeColors.backgroundGlass,
          borderRadius: '20px',
          boxShadow: themeColors.shadowLg,
          backdropFilter: 'blur(16px)',
          border: `1px solid ${themeColors.borderLight}`,
        }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px',
            background: themeColors.primaryGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 2px 4px ${themeColors.primary}40)`,
          }}>✨</div>
          <h1 style={{ 
            marginBottom: '24px', 
            color: themeColors.text,
            fontSize: '32px',
            fontWeight: '800',
            background: themeColors.primaryGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.025em',
          }}>{t('waitlist.youreOnTheList')}</h1>
          <div style={{
            background: `linear-gradient(135deg, ${themeColors.primary}20 0%, ${themeColors.secondary}20 50%, ${themeColors.accent}20 100%)`,
            border: `2px solid ${themeColors.primary}40`,
            borderRadius: '16px',
            padding: '36px',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ 
              color: themeColors.textSecondary, 
              marginBottom: '12px',
              fontSize: '16px',
              fontWeight: '600',
            }}>{t('waitlist.yourPosition')}</p>
            <div style={{
              fontSize: '56px',
              fontWeight: '900',
              background: themeColors.primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.05em',
            }}>
              #{displayPosition}
            </div>
          </div>
          <p style={{ 
            color: themeColors.textSecondary,
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '1.6',
          }}>
            {t('waitlist.notifyEmail', { email: email || 'your email' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: themeColors.primaryGradient,
        ...style
      }}
    >
      <div style={{
        background: themeColors.backgroundGlass,
        borderRadius: '20px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: themeColors.shadowLg,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${themeColors.borderLight}`,
      }}>
        <h1 style={{ 
          marginBottom: '12px', 
          color: themeColors.text,
          fontSize: '32px',
          fontWeight: '800',
          background: themeColors.primaryGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.025em',
        }}>
          {t('waitlist.earlyAccess')}
        </h1>
        <p style={{ 
          color: themeColors.textSecondary,
          marginBottom: '36px',
          fontSize: '16px',
          fontWeight: '500',
          lineHeight: '1.6',
        }}>
          {message || t('waitlist.joinWaitlistMessage')}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder={t('waitlist.enterYourEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: `2px solid ${themeColors.inputBorder}`,
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontWeight: '500',
                backgroundColor: themeColors.inputBackground,
                backdropFilter: 'blur(8px)',
                color: themeColors.text,
              }}
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
          </div>

          {error && (
            <p style={{ 
              color: themeColors.error,
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              backgroundColor: `${themeColors.error}20`,
              border: `1px solid ${themeColors.error}40`,
              borderRadius: '8px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '700',
              background: isSubmitting 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                : themeColors.primaryGradient,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'inherit',
              letterSpacing: '0.025em',
              boxShadow: isSubmitting 
                ? 'none'
                : themeColors.shadow,
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 20px 40px -5px ${themeColors.primary}80, 0 8px 16px -4px ${themeColors.primary}40`;
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = themeColors.shadow;
              }
            }}
          >
            {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: themeColors.textMuted,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {t('waitlist.noSpam')}
        </p>
      </div>
    </div>
  );
}

