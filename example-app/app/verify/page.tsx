'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GrowthKitProvider, useGrowthKit } from '@growthkit/sdk';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, refresh } = useGrowthKit();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify the email
    verifyEmail(token).then(async (success) => {
      if (success) {
        setStatus('success');
        setMessage('Email verified successfully! +1 credit earned');
        await refresh(); // Update credits
        
        // Redirect to main app after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Verification failed. The token may be invalid or expired.');
      }
    }).catch((error) => {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    });
  }, [searchParams, verifyEmail, refresh, router]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'verifying' && (
          <>
            <div style={styles.spinner} />
            <h2 style={styles.title}>Verifying your email...</h2>
            <p style={styles.text}>Please wait while we verify your email address</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.title}>Email Verified!</h2>
            <p style={styles.text}>{message}</p>
            <p style={styles.subtext}>Redirecting to app...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✕</div>
            <h2 style={styles.title}>Verification Failed</h2>
            <p style={styles.text}>{message}</p>
            <a href="/" style={styles.link}>
              Return to app
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || '',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`,
    debug: process.env.NODE_ENV === 'development',
  };

  return (
    <GrowthKitProvider config={config}>
      <VerifyContent />
    </GrowthKitProvider>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '3rem',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #0070f3',
    borderRadius: '50%',
    margin: '0 auto 1.5rem',
    animation: 'spin 1s linear infinite',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    background: '#4caf50',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    margin: '0 auto 1.5rem',
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    background: '#e74c3c',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    margin: '0 auto 1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    color: '#333',
    marginBottom: '1rem',
  },
  text: {
    color: '#666',
    fontSize: '1.1rem',
    marginBottom: '1rem',
  },
  subtext: {
    color: '#999',
    fontSize: '0.95rem',
    fontStyle: 'italic',
  },
  link: {
    display: 'inline-block',
    marginTop: '1.5rem',
    padding: '0.75rem 1.5rem',
    background: '#0070f3',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    transition: 'background 0.2s',
  },
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
