'use client';

import React, { useState, FormEvent } from 'react';
import { useGrowthKit } from '../useGrowthKit';

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
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
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
        setError('Failed to join waitlist. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
          ...style
        }}
      >
        <div style={{
          textAlign: 'center',
          padding: '48px',
          maxWidth: '520px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))',
          }}>✨</div>
          <h1 style={{ 
            marginBottom: '24px', 
            color: '#1e293b',
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.025em',
          }}>You're on the list!</h1>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '36px',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ 
              color: '#64748b', 
              marginBottom: '12px',
              fontSize: '16px',
              fontWeight: '600',
            }}>Your position:</p>
            <div style={{
              fontSize: '56px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.05em',
            }}>
              #{displayPosition}
            </div>
          </div>
          <p style={{ 
            color: '#64748b',
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '1.6',
          }}>
            We'll notify you at {email || 'your email'} when it's your turn!
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
        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
        ...style
      }}
    >
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h1 style={{ 
          marginBottom: '12px', 
          color: '#1e293b',
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.025em',
        }}>
          Early Access
        </h1>
        <p style={{ 
          color: '#64748b',
          marginBottom: '36px',
          fontSize: '16px',
          fontWeight: '500',
          lineHeight: '1.6',
        }}>
          {message || 'Join our exclusive waitlist for early access'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontWeight: '500',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
              }}
            />
          </div>

          {error && (
            <p             style={{ 
              color: '#ef4444',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
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
                : 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'inherit',
              letterSpacing: '0.025em',
              boxShadow: isSubmitting 
                ? 'none'
                : '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(16, 185, 129, 0.5), 0 8px 16px -4px rgba(16, 185, 129, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.1)';
              }
            }}
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          No spam. We'll only email you when it's your turn.
        </p>
      </div>
    </div>
  );
}

