'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { useTranslation } from '../localization';

export interface EmbedWaitlistWidgetProps {
  variant?: 'compact' | 'standard';
  onSuccess?: (position: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Embeddable app-level waitlist widget
 * Shows position and gives credits (unlike product waitlists)
 */
export function EmbedWaitlistWidget({
  variant = 'standard',
  onSuccess,
  className,
  style,
}: EmbedWaitlistWidgetProps) {
  const growthKit = useGrowthKit();
  const { themeColors } = useGrowthKitConfig();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { app, waitlistStatus, waitlistPosition, joinWaitlist } = growthKit;
  const brandColor = app?.primaryColor || themeColors.primary;
  
  // Check if user is already on waitlist
  const isOnWaitlist = waitlistStatus === 'waiting' || waitlistStatus === 'invited' || waitlistStatus === 'accepted';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(t('waitlist.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('waitlist.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await joinWaitlist(email);
      
      if (success) {
        await growthKit.refresh();
        const newPosition = growthKit.waitlistPosition || 0;
        
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

  // Success state - user is on waitlist
  if (isOnWaitlist) {
    const displayPosition = waitlistPosition || 0;
    
    return (
      <div 
        className={className}
        style={{
          padding: variant === 'compact' ? '1rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
          border: `2px solid ${brandColor}40`,
          borderRadius: '1rem',
          ...style
        }}
      >
        <div className="text-center">
          <div style={{ 
            fontSize: variant === 'compact' ? '2rem' : '3rem', 
            marginBottom: variant === 'compact' ? '0.5rem' : '1rem'
          }}>✓</div>
          
          <h3 style={{ 
            fontSize: variant === 'compact' ? '1rem' : '1.25rem',
            fontWeight: 'bold',
            color: brandColor,
            marginBottom: '0.5rem'
          }}>
            {t('waitlist.youreOnTheList')}
          </h3>
          
          <div style={{
            fontSize: variant === 'compact' ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: brandColor,
            marginBottom: '0.5rem'
          }}>
            #{displayPosition}
          </div>
          
          <p style={{ 
            fontSize: '0.875rem',
            color: '#6b7280',
          }}>
            {t('waitlist.notifyEmail', { email: email || 'your email' })}
          </p>
        </div>
      </div>
    );
  }

  // Compact variant - minimal form
  if (variant === 'compact') {
    return (
      <div className={className} style={style}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder={t('waitlist.enterYourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = brandColor;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              background: brandColor,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? '...' : t('waitlist.joinWaitlist')}
          </button>
        </form>
        {error && (
          <p style={{ 
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#ef4444',
          }}>
            {error}
          </p>
        )}
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
        }}>
          {t('waitlist.noSpam')}
        </p>
      </div>
    );
  }

  // Standard variant - full form
  return (
    <div 
      className={className}
      style={{
        padding: '2rem',
        background: 'white',
        borderRadius: '1rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        ...style
      }}
    >
      {app?.logoUrl && (
        <img
          src={app.logoUrl}
          alt={app.name}
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '0.75rem',
            marginBottom: '1rem',
            objectFit: 'contain',
          }}
        />
      )}
      
      <h3 style={{ 
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: brandColor,
        marginBottom: '0.5rem'
      }}>
        {app?.name || 'Join Waitlist'}
      </h3>
      
      {app?.description && (
        <p style={{ 
          fontSize: '0.875rem',
          color: '#6b7280',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          {app.description}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder={t('waitlist.enterYourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.75rem',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = brandColor;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${brandColor}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && (
          <p style={{ 
            color: '#ef4444',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            background: isSubmitting ? '#9ca3af' : brandColor,
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseOut={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
        </button>

        <p style={{
          marginTop: '0.75rem',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.75rem',
        }}>
          {t('waitlist.noSpam')}
        </p>
      </form>
    </div>
  );
}

