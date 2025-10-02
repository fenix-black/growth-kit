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
 * Modern waitlist form component with app branding
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

  const { app } = growthKit;
  const layout = app?.waitlistLayout || 'centered';
  const brandColor = app?.primaryColor || themeColors.primary;
  const bgColor = app?.backgroundColor || 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)';
  const cardBgColor = app?.cardBackgroundColor || 'rgba(255, 255, 255, 0.05)';
  
  // Get custom message from props, messages array, or fallback
  const getCustomMessage = () => {
    if (message) return message; // Props message takes priority
    
    // Check if we have messages array from waitlist data
    const messages = growthKit.waitlist?.messages || [];
    if (messages.length > 0) {
      // Randomly select a message from the array
      const randomIndex = Math.floor(Math.random() * messages.length);
      return messages[randomIndex];
    }
    
    // Backwards compatibility: check for single message
    if (growthKit.waitlistMessage) return growthKit.waitlistMessage;
    
    // Final fallback
    return app?.description ? null : 'Join our exclusive waitlist for early access';
  };
  
  const displayMessage = getCustomMessage();

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
      const success = await growthKit.joinWaitlist(email);
      
      if (success) {
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

  // Generate logo fallback from app name
  const getLogoFallback = () => {
    if (!app?.name) return 'WL';
    const words = app.name.split(' ');
    const initials = words.map(w => w[0]).join('').toUpperCase().substring(0, 2);
    return initials;
  };

  // Success state - user is on waitlist
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 15s ease infinite',
          ...style
        }}
      >
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
        `}</style>
        
        <div style={{
          textAlign: 'center',
          padding: '56px',
          maxWidth: '520px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px',
            animation: 'pulse 2s ease-in-out 1',
          }}>✨</div>
          
          <h1 style={{ 
            marginBottom: '24px', 
            color: 'white',
            fontSize: '32px',
            fontWeight: '900',
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.03em',
          }}>{t('waitlist.youreOnTheList')}</h1>
          
          <div style={{
            background: `linear-gradient(135deg, ${brandColor}20 0%, ${brandColor}10 100%)`,
            border: `2px solid ${brandColor}40`,
            borderRadius: '16px',
            padding: '36px',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '12px',
              fontSize: '16px',
              fontWeight: '600',
            }}>{t('waitlist.yourPosition')}</p>
            <div style={{
              fontSize: '56px',
              fontWeight: '900',
              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.05em',
            }}>
              #{displayPosition}
            </div>
          </div>
          
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '1.6',
          }}>
            {t('waitlist.notifyEmail', { email: email || 'your email' })}
          </p>

          {!app?.hideGrowthKitBranding && (
            <a
              href="https://growth.fenixblack.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                textDecoration: 'none',
                transition: 'opacity 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img 
                src="https://growth.fenixblack.ai/growthkit-logo-dark-alpha.png"
                alt="GrowthKit"
                style={{
                  height: '24px',
                  width: 'auto',
                }}
              />
              <span style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '11px',
                fontWeight: '500',
              }}>
                Powered by GrowthKit
              </span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Get smart waitlist message based on count
  const getWaitlistMessage = () => {
    const waitlistCount = growthKit.waitlist?.count || 0;
    const threshold = 500;
    
    // If count is significant, show it
    if (waitlistCount >= threshold) {
      if (waitlistCount >= 1000) {
        return `Join ${waitlistCount.toLocaleString()} others on the waitlist`;
      }
      return `Join over ${Math.floor(waitlistCount / 100) * 100} on the waitlist`;
    }
    
    // Otherwise show value-driven message
    return displayMessage || 'Be among the first to get access';
  };

  // Join form - render based on layout
  const renderCenteredLayout = () => (
    <div 
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: bgColor,
        backgroundSize: bgColor.includes('gradient') ? '200% 200%' : 'auto',
        animation: bgColor.includes('gradient') ? 'gradientShift 15s ease infinite' : 'none',
        padding: '24px',
        ...style
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoFloat {
          from { opacity: 0; transform: translateY(-20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating Logo Container */}
      <div style={{
        position: 'relative',
        maxWidth: '520px',
        width: '100%',
      }}>
        {/* Logo - Floating above card */}
        {app?.logoUrl || app?.name ? (
          <div style={{
            position: 'relative',
            zIndex: 2,
            marginBottom: '-70px', // Overlap with card
            display: 'flex',
            justifyContent: 'center',
            animation: 'logoFloat 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            {app?.logoUrl ? (
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '28px',
                background: 'rgba(255, 255, 255, 0.98)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 20px 60px ${brandColor}40, 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)`,
                backdropFilter: 'blur(10px)',
              }}>
                <img 
                  src={app.logoUrl} 
                  alt={app.name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '28px',
                background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: '800',
                color: 'white',
                boxShadow: `0 20px 60px ${brandColor}50, 0 8px 24px rgba(0, 0, 0, 0.3)`,
                letterSpacing: '-0.02em',
              }}>
                {getLogoFallback()}
              </div>
            )}
          </div>
        ) : null}

        {/* Main Card */}
        <div style={{
          background: cardBgColor,
          borderRadius: '24px',
          padding: app?.logoUrl || app?.name ? '90px 64px 64px' : '64px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          backdropFilter: cardBgColor.includes('rgba') || cardBgColor.includes('transparent') ? 'blur(20px) saturate(180%)' : 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* App Name */}
          <h1 style={{ 
            marginBottom: '16px', 
            color: 'white',
            fontSize: '40px',
            fontWeight: '900',
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.03em',
            textAlign: 'center',
            lineHeight: '1.1',
          }}>
            {app?.name || 'Early Access'}
          </h1>
          
          {/* App Description */}
          {app?.description && (
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: '32px',
              fontSize: '17px',
              fontWeight: '500',
              lineHeight: '1.6',
              textAlign: 'center',
            }}>
              {app.description}
            </p>
          )}

          {/* Waitlist Context Message */}
          <div style={{
            background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}08 100%)`,
            border: `1px solid ${brandColor}30`,
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            <p style={{
              color: brandColor,
              fontSize: '16px',
              fontWeight: '700',
              lineHeight: '1.5',
              margin: 0,
            }}>
              {getWaitlistMessage()}
            </p>
          </div>

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
                  padding: '18px 24px',
                  fontSize: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = brandColor;
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${brandColor}20`;
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              />
            </div>

            {error && (
              <p style={{ 
                color: '#ef4444',
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '20px 32px',
                fontSize: '18px',
                fontWeight: '700',
                background: isSubmitting 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                  : `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontFamily: 'inherit',
                letterSpacing: '0.025em',
                boxShadow: isSubmitting 
                  ? 'none'
                  : `0 10px 30px ${brandColor}40, 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 20px 50px ${brandColor}60, 0 0 0 1px rgba(255, 255, 255, 0.2) inset`;
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${brandColor}40, 0 0 0 1px rgba(255, 255, 255, 0.1) inset`;
                }
              }}
            >
              {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
            </button>
          </form>

          <p style={{
            marginTop: '24px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            {t('waitlist.noSpam')}
          </p>

          {!app?.hideGrowthKitBranding && (
            <a
              href="https://growth.fenixblack.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '40px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                textDecoration: 'none',
                transition: 'opacity 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img 
                src="https://growth.fenixblack.ai/growthkit-logo-dark-alpha.png"
                alt="GrowthKit"
                style={{
                  height: '24px',
                  width: 'auto',
                }}
              />
              <span style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '11px',
                fontWeight: '500',
              }}>
                Powered by GrowthKit
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const renderSplitLayout = () => (
    <div 
      className={className}
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        ...style
      }}
    >
      {/* Left side - Branding */}
      <div style={{
        flex: '1',
        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
        padding: '80px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        {app?.logoUrl && (
          <img 
            src={app.logoUrl} 
            alt={app.name}
            style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '24px',
              marginBottom: '32px',
              objectFit: 'cover',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          />
        )}
        <h1 style={{
          fontSize: '48px',
          fontWeight: '900',
          color: 'white',
          marginBottom: '16px',
          lineHeight: '1.1',
        }}>
          {app?.name || 'Join the Waitlist'}
        </h1>
        {app?.description && (
          <p style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.5',
            marginBottom: '24px',
          }}>
            {app.description}
          </p>
        )}
        {displayMessage && (
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.95)',
            fontWeight: '600',
          }}>
            {displayMessage}
          </p>
        )}
      </div>

      {/* Right side - Form */}
      <div style={{
        flex: '1',
        background: '#ffffff',
        padding: '80px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '32px',
          }}>
            Get Early Access
          </h2>

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
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              outline: 'none',
              marginBottom: '16px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
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

          {error && (
            <p style={{ 
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '14px',
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
              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
          </button>

          <p style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
          }}>
            {t('waitlist.noSpam')}
          </p>
        </form>

        {!app?.hideGrowthKitBranding && (
          <a
            href="https://growth.fenixblack.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src="https://growth.fenixblack.ai/growthkit-logo-alpha.png"
              alt="GrowthKit"
              style={{
                height: '24px',
                width: 'auto',
              }}
            />
            <span style={{
              color: '#9ca3af',
              fontSize: '11px',
              fontWeight: '500',
            }}>
              Powered by GrowthKit
            </span>
          </a>
        )}
      </div>
    </div>
  );

  const renderMinimalLayout = () => (
    <div 
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: '#ffffff',
        ...style
      }}
    >
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '24px',
      }}>
        {app?.logoUrl && (
          <img 
            src={app.logoUrl} 
            alt={app.name}
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px',
              marginBottom: '16px',
              objectFit: 'cover',
            }}
          />
        )}
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '8px',
        }}>
          {app?.name || 'Join Waitlist'}
        </h1>
        
        {(app?.description || displayMessage) && (
          <p style={{
            color: '#6b7280',
            marginBottom: '24px',
            fontSize: '14px',
          }}>
            {displayMessage || app?.description}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t('waitlist.enterYourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none',
              marginBottom: '12px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />

          {error && (
            <p style={{ 
              color: '#ef4444',
              marginBottom: '12px',
              fontSize: '13px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              background: brandColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
          </button>
        </form>

        {!app?.hideGrowthKitBranding && (
          <a
            href="https://growth.fenixblack.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src="https://growth.fenixblack.ai/growthkit-logo-alpha.png"
              alt="GrowthKit"
              style={{
                height: '20px',
                width: 'auto',
              }}
            />
            <span style={{
              color: '#9ca3af',
              fontSize: '10px',
              fontWeight: '500',
            }}>
              Powered by GrowthKit
            </span>
          </a>
        )}
      </div>
    </div>
  );

  // Render based on layout
  switch (layout) {
    case 'split':
      return renderSplitLayout();
    case 'minimal':
      return renderMinimalLayout();
    case 'centered':
    default:
      return renderCenteredLayout();
  }
}
