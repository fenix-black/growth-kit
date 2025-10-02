'use client';

import React, { useState, FormEvent } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { useTranslation, interpolate } from '../localization';
import { ProductWaitlistWidget } from './ProductWaitlistWidget';
import { EmbedWaitlistWidget } from './EmbedWaitlistWidget';

export interface WaitlistFormProps {
  message?: string;
  onSuccess?: (position: number) => void;
  className?: string;
  style?: React.CSSProperties;
  // Product waitlist props
  productTag?: string;
  mode?: 'inline' | 'modal' | 'drawer';
  variant?: 'compact' | 'standard';
  hidePosition?: boolean;
  trigger?: React.ReactNode;
  drawerPosition?: 'left' | 'right';
  // Embed mode props (for app-level waitlist)
  layout?: 'centered' | 'split' | 'minimal' | 'embed';
  targetSelector?: string;
}

/**
 * Modern waitlist form component with app branding
 * Supports both app-level (full-page) and product-level (embeddable) waitlists
 */
export function WaitlistForm({ 
  message,
  onSuccess,
  className,
  style,
  productTag,
  mode,
  variant,
  hidePosition,
  trigger,
  drawerPosition,
  layout: layoutProp,
  targetSelector,
}: WaitlistFormProps) {
  // Get app data first to determine layout
  const growthKit = useGrowthKit();
  const { themeColors } = useGrowthKitConfig();
  const { t } = useTranslation();
  const { app } = growthKit;
  
  // Determine effective layout (prop overrides app setting)
  const effectiveLayout = layoutProp || app?.waitlistLayout || 'centered';

  // If productTag is provided, use the product waitlist widget
  if (productTag) {
    return (
      <ProductWaitlistWidget
        productTag={productTag}
        mode={mode}
        variant={variant}
        trigger={trigger}
        position={drawerPosition}
        onSuccess={onSuccess ? (data) => onSuccess(0) : undefined}
        className={className}
        style={style}
      />
    );
  }

  // If embed layout is requested (from prop OR app setting), use the embed widget
  if (effectiveLayout === 'embed') {
    const widget = (
      <EmbedWaitlistWidget
        variant={variant}
        onSuccess={onSuccess}
        className={className}
        style={style}
      />
    );

    // If targetSelector provided, inject into that element
    if (targetSelector && typeof window !== 'undefined') {
      React.useEffect(() => {
        const target = document.querySelector(targetSelector);
        if (target) {
          const container = document.createElement('div');
          target.appendChild(container);
          
          // This is a simplified approach - in production you'd use ReactDOM.createRoot
          // For now, we'll just render where the component is placed
        }
      }, [targetSelector]);
    }

    return widget;
  }

  // Original app-level waitlist logic below (full-page modes)
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const layout = effectiveLayout;
  const brandColor = app?.primaryColor || themeColors.primary;
  const bgColor = app?.backgroundColor || 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)';
  const cardBgColor = app?.cardBackgroundColor || 'rgba(255, 255, 255, 0.05)';
  
  // For split layout, determine if right side should be light or dark
  const isLightBackground = (color: string) => {
    if (color.includes('ffffff') || color.includes('f3f4f6') || color.includes('fafafa')) return true;
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    }
    return false;
  };
  
  // Get the base color for split layout right side
  const getSplitRightBg = () => {
    // If cardBgColor is solid and light, use it
    if (!cardBgColor.includes('rgba') && isLightBackground(cardBgColor)) {
      return cardBgColor;
    }
    // If cardBgColor is solid and dark, use white as contrast
    if (!cardBgColor.includes('rgba') && !isLightBackground(cardBgColor)) {
      return '#ffffff';
    }
    // For transparent cards in split, use white background
    return '#ffffff';
  };
  
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
        background: bgColor,
        backgroundSize: bgColor.includes('gradient') ? '200% 200%' : 'auto',
        padding: '80px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Logo */}
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
            marginBottom: '48px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
          }}>
            <img 
              src={app.logoUrl} 
              alt={app.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
              }}
            />
          </div>
        ) : app?.name ? (
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
            marginBottom: '48px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            letterSpacing: '-0.02em',
          }}>
            {getLogoFallback()}
          </div>
        ) : null}

        <h1 style={{
          fontSize: '56px',
          fontWeight: '900',
          color: 'white',
          marginBottom: '24px',
          lineHeight: '1.1',
          letterSpacing: '-0.03em',
          textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
        }}>
          {app?.name || 'Join the Waitlist'}
        </h1>
        
        {app?.description && (
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.95)',
            lineHeight: '1.6',
            marginBottom: '32px',
            fontWeight: '500',
            maxWidth: '500px',
          }}>
            {app.description}
          </p>
        )}

        {/* Waitlist Message Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '20px 28px',
          marginTop: '16px',
          maxWidth: '500px',
        }}>
          <p style={{
            fontSize: '18px',
            color: 'white',
            fontWeight: '700',
            margin: 0,
            lineHeight: '1.5',
          }}>
            {getWaitlistMessage()}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{
        flex: '1',
        background: getSplitRightBg(),
        padding: '80px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '440px', width: '100%' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: isLightBackground(getSplitRightBg()) ? '#1f2937' : 'white',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            lineHeight: '1.2',
          }}>
            Get Early Access
          </h2>
          
          <p style={{
            fontSize: '16px',
            color: isLightBackground(getSplitRightBg()) ? '#6b7280' : 'rgba(255, 255, 255, 0.8)',
            marginBottom: '40px',
            lineHeight: '1.6',
          }}>
            Enter your email to join the waitlist
          </p>

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
              border: isLightBackground(getSplitRightBg()) ? '2px solid #e5e7eb' : '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              outline: 'none',
              marginBottom: '20px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              fontWeight: '500',
              backgroundColor: isLightBackground(getSplitRightBg()) ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightBackground(getSplitRightBg()) ? '#1f2937' : 'white',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = brandColor;
              e.currentTarget.style.boxShadow = `0 0 0 4px ${brandColor}20`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isLightBackground(getSplitRightBg()) ? '#e5e7eb' : 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          />

          {error && (
            <p style={{ 
              color: '#ef4444',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
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

          <p style={{
            marginTop: '24px',
            textAlign: 'center',
            color: isLightBackground(getSplitRightBg()) ? '#6b7280' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
            fontWeight: '500',
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
              paddingTop: '32px',
              borderTop: isLightBackground(getSplitRightBg()) ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src={isLightBackground(getSplitRightBg())
                ? "https://growth.fenixblack.ai/growthkit-logo-alpha.png"
                : "https://growth.fenixblack.ai/growthkit-logo-dark-alpha.png"}
              alt="GrowthKit"
              style={{
                height: '24px',
                width: 'auto',
              }}
            />
            <span style={{
              color: isLightBackground(getSplitRightBg()) ? '#9ca3af' : 'rgba(255, 255, 255, 0.5)',
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

  const renderMinimalLayout = () => {
    const minimalBg = isLightBackground(bgColor.includes('gradient') ? bgColor.split('#')[1]?.substring(0, 6) || '#ffffff' : bgColor) 
      ? (bgColor.includes('gradient') ? '#ffffff' : bgColor)
      : '#ffffff';
    const isDarkBg = !isLightBackground(minimalBg);

    return (
    <div 
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: minimalBg,
        padding: '24px',
        ...style
      }}
    >
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '32px',
      }}>
        {/* Logo */}
        {app?.logoUrl ? (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            background: isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'white',
            padding: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: isDarkBg ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
          }}>
            <img 
              src={app.logoUrl} 
              alt={app.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
              }}
            />
          </div>
        ) : app?.name ? (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '24px',
            boxShadow: `0 4px 12px ${brandColor}40`,
          }}>
            {getLogoFallback()}
          </div>
        ) : null}
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: isDarkBg ? 'white' : '#1f2937',
          marginBottom: '12px',
          letterSpacing: '-0.02em',
          lineHeight: '1.2',
        }}>
          {app?.name || 'Join Waitlist'}
        </h1>
        
        {app?.description && (
          <p style={{
            color: isDarkBg ? 'rgba(255, 255, 255, 0.8)' : '#6b7280',
            marginBottom: '24px',
            fontSize: '16px',
            lineHeight: '1.5',
            fontWeight: '500',
          }}>
            {app.description}
          </p>
        )}

        {/* Waitlist Message */}
        <div style={{
          background: isDarkBg ? 'rgba(255, 255, 255, 0.1)' : `${brandColor}10`,
          border: isDarkBg ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${brandColor}30`,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
        }}>
          <p style={{
            color: isDarkBg ? 'white' : brandColor,
            fontSize: '14px',
            fontWeight: '600',
            margin: 0,
            lineHeight: '1.5',
          }}>
            {getWaitlistMessage()}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t('waitlist.enterYourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: '15px',
              border: isDarkBg ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #d1d5db',
              borderRadius: '12px',
              outline: 'none',
              marginBottom: '16px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              fontWeight: '500',
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.05)' : 'white',
              color: isDarkBg ? 'white' : '#1f2937',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = brandColor;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${brandColor}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isDarkBg ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          {error && (
            <p style={{ 
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: '700',
              background: isSubmitting 
                ? '#9ca3af' 
                : `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSubmitting ? 'none' : `0 4px 12px ${brandColor}30`,
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${brandColor}40`;
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${brandColor}30`;
              }
            }}
          >
            {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
          </button>
          
          <p style={{
            marginTop: '16px',
            textAlign: 'center',
            color: isDarkBg ? 'rgba(255, 255, 255, 0.6)' : '#9ca3af',
            fontSize: '13px',
            fontWeight: '500',
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
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: isDarkBg ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src={isDarkBg 
                ? "https://growth.fenixblack.ai/growthkit-logo-dark-alpha.png"
                : "https://growth.fenixblack.ai/growthkit-logo-alpha.png"}
              alt="GrowthKit"
              style={{
                height: '22px',
                width: 'auto',
              }}
            />
            <span style={{
              color: isDarkBg ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
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
  };

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
