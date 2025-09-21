import React, { useState, FormEvent } from 'react';
import { GrowthKitHook } from '../types';

export interface WaitlistFormProps {
  growthKit: GrowthKitHook;
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
 * <WaitlistForm 
 *   growthKit={useGrowthKit(config)}
 *   message="Join our exclusive waitlist!"
 * />
 * ```
 */
export function WaitlistForm({ 
  growthKit, 
  message,
  onSuccess,
  className,
  style 
}: WaitlistFormProps) {
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
          ...style
        }}
      >
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '500px',
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ marginBottom: '20px', color: '#333' }}>You're on the list!</h1>
          <div style={{
            background: '#f0f7ff',
            border: '2px solid #0066cc',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '20px',
          }}>
            <p style={{ color: '#666', marginBottom: '10px' }}>Your position:</p>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#0066cc',
            }}>
              #{displayPosition}
            </div>
          </div>
          <p style={{ color: '#666' }}>
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        ...style
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ 
          marginBottom: '10px', 
          color: '#333',
          fontSize: '28px',
        }}>
          Early Access
        </h1>
        <p style={{ 
          color: '#666',
          marginBottom: '30px',
          fontSize: '16px',
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
                padding: '14px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
              }}
            />
          </div>

          {error && (
            <p style={{ 
              color: '#e74c3c',
              marginBottom: '20px',
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
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: isSubmitting 
                ? '#999' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.opacity = '0.95';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '1';
            }}
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>

        <p style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
        }}>
          No spam. We'll only email you when it's your turn.
        </p>
      </div>
    </div>
  );
}
