'use client';

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { useGrowthKit } from '../useGrowthKit';
import { GrowthKitAPI } from '../api';

export interface NameChangeModalRef {
  open: () => void;
  close: () => void;
}

type Step = 'enterName' | 'enterCode' | 'success' | 'locked';

export const NameChangeModal = forwardRef<NameChangeModalRef>((_, ref) => {
  const { config, themeColors } = useGrowthKitConfig();
  const { name: currentName, refresh } = useGrowthKit();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('enterName');
  const [newName, setNewName] = useState('');
  const [code, setCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
      resetState();
    },
    close: () => setIsOpen(false),
  }));

  const resetState = () => {
    setStep('enterName');
    setNewName(currentName || '');
    setCode('');
    setError(null);
    setFailedAttempts(0);
    setLockedUntil(null);
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Lock countdown timer
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      if (lockedUntil <= new Date()) {
        setLockedUntil(null);
        setStep('enterName');
        setFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === currentName) {
      setError('Please enter a different name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = new GrowthKitAPI(config.apiKey, config.publicKey, config.apiUrl);
      const result = await api.requestNameChange(newName.trim());

      if (result.success) {
        setMaskedEmail(result.email || '');
        setExpiresAt(result.expiresAt ? new Date(result.expiresAt) : null);
        setStep('enterCode');
      } else if (result.error === 'rate_limited') {
        setError(result.message || 'Please wait before requesting a new code');
      } else {
        setError(result.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = new GrowthKitAPI(config.apiKey, config.publicKey, config.apiUrl);
      const result = await api.confirmNameChange(code);

      if (result.success) {
        setStep('success');
        await refresh();
      } else if (result.error === 'locked') {
        setStep('locked');
        setLockedUntil(new Date(Date.now() + 5 * 60 * 1000)); // 5 minutes
      } else if (result.error === 'invalid_code') {
        setFailedAttempts(3 - (result.remainingAttempts || 0));
        setError(result.message || 'Invalid code');
      } else {
        setError(result.message || 'Failed to verify code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  const formatTimeRemaining = (date: Date) => {
    const seconds = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ ...styles.overlay, backgroundColor: themeColors.overlay }} onClick={handleOverlayClick}>
      <div style={{
        ...styles.modal,
        backgroundColor: themeColors.background,
        boxShadow: themeColors.shadowLg,
        border: `1px solid ${themeColors.borderLight}`,
      }}>
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          style={{ ...styles.closeButton, color: themeColors.textSecondary }}
        >
          ×
        </button>

        {/* Step: Enter Name */}
        {step === 'enterName' && (
          <form onSubmit={handleRequestCode}>
            <h2 style={{ ...styles.title, color: themeColors.text }}>Change Your Name</h2>
            <p style={{ ...styles.subtitle, color: themeColors.textSecondary }}>
              Current name: <strong>{currentName || 'Not set'}</strong>
            </p>
            
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              style={{
                ...styles.input,
                backgroundColor: themeColors.inputBackground,
                borderColor: themeColors.inputBorder,
                color: themeColors.text,
              }}
              disabled={loading}
              autoFocus
            />

            {error && <p style={styles.error}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !newName.trim() || newName.trim() === currentName}
              style={{
                ...styles.primaryButton,
                background: themeColors.primaryGradient,
                opacity: loading || !newName.trim() || newName.trim() === currentName ? 0.5 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step: Enter Code */}
        {step === 'enterCode' && (
          <form onSubmit={handleConfirmCode}>
            <h2 style={{ ...styles.title, color: themeColors.text }}>Enter Verification Code</h2>
            <p style={{ ...styles.subtitle, color: themeColors.textSecondary }}>
              We sent a code to <strong>{maskedEmail}</strong>
            </p>

            <div style={styles.namePreview}>
              <span style={{ color: themeColors.textSecondary }}>Changing to:</span>
              <strong style={{ color: themeColors.text }}>{newName}</strong>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              style={{
                ...styles.input,
                ...styles.codeInput,
                backgroundColor: themeColors.inputBackground,
                borderColor: themeColors.inputBorder,
                color: themeColors.text,
              }}
              disabled={loading}
              autoFocus
              maxLength={6}
            />

            {error && <p style={styles.error}>{error}</p>}

            {expiresAt && (
              <p style={{ ...styles.expiry, color: themeColors.textSecondary }}>
                Code expires in: {formatTimeRemaining(expiresAt)}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                ...styles.primaryButton,
                background: themeColors.primaryGradient,
                opacity: loading || code.length !== 6 ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Confirm Change'}
            </button>

            <button
              type="button"
              onClick={() => setStep('enterName')}
              style={{ ...styles.linkButton, color: themeColors.textSecondary }}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div style={styles.centered}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={{ ...styles.title, color: themeColors.text }}>Name Updated!</h2>
            <p style={{ ...styles.subtitle, color: themeColors.textSecondary }}>
              Your name has been changed to <strong>{newName}</strong>
            </p>
            <button
              onClick={() => setIsOpen(false)}
              style={{ ...styles.primaryButton, background: themeColors.primaryGradient }}
            >
              Done
            </button>
          </div>
        )}

        {/* Step: Locked */}
        {step === 'locked' && (
          <div style={styles.centered}>
            <div style={styles.lockIcon}>🔒</div>
            <h2 style={{ ...styles.title, color: themeColors.text }}>Too Many Attempts</h2>
            <p style={{ ...styles.subtitle, color: themeColors.textSecondary }}>
              For security, please wait before trying again.
            </p>
            {lockedUntil && (
              <p style={{ ...styles.countdown, color: themeColors.warning }}>
                Try again in: {formatTimeRemaining(lockedUntil)}
              </p>
            )}
            <button
              onClick={() => setIsOpen(false)}
              style={{ ...styles.secondaryButton, borderColor: themeColors.border, color: themeColors.text }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

NameChangeModal.displayName = 'NameChangeModal';

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    padding: '20px',
  },
  modal: {
    position: 'relative',
    padding: '32px',
    borderRadius: '16px',
    maxWidth: '400px',
    width: '100%',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '22px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid',
    borderRadius: '10px',
    fontSize: '16px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '16px',
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: '8px',
    fontSize: '24px',
    fontWeight: '600',
  },
  namePreview: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  primaryButton: {
    width: '100%',
    padding: '14px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
  },
  secondaryButton: {
    width: '100%',
    padding: '14px 20px',
    background: 'transparent',
    border: '2px solid',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '12px',
    fontFamily: 'inherit',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    margin: '0 0 12px 0',
  },
  expiry: {
    fontSize: '13px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  centered: {
    textAlign: 'center',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    color: 'white',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  lockIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  countdown: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '20px',
  },
};

