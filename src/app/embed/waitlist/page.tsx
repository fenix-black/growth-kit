'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GrowthKitProvider } from '../../../../sdk/src/components/GrowthKitProvider';
import { EmbedWaitlistWidget } from '../../../../sdk/src/components/EmbedWaitlistWidget';
import type { GrowthKitConfig, GrowthKitTheme } from '../../../../sdk/src/types';

/**
 * Embedded Waitlist Widget Page
 * 
 * URL Parameters:
 * - pk: Public key (required)
 * - theme: 'light' | 'dark' | 'auto' (default: 'auto')
 * - lang: 'en' | 'es' (default: 'en')
 * - variant: 'compact' | 'standard' (default: 'standard')
 * 
 * Example:
 * /embed/waitlist?pk=pk_xxx&theme=dark&lang=es&variant=compact
 */
function EmbedWaitlistContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<GrowthKitConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<'compact' | 'standard'>('standard');

  useEffect(() => {
    const publicKey = searchParams.get('pk');
    const theme = (searchParams.get('theme') as GrowthKitTheme) || 'auto';
    const language = (searchParams.get('lang') as 'en' | 'es') || 'en';
    const variantParam = searchParams.get('variant') as 'compact' | 'standard';
    
    if (!publicKey) {
      setError('Missing public key. Add ?pk=your_public_key to the URL.');
      return;
    }

    if (!publicKey.startsWith('pk_')) {
      setError('Invalid public key format. Public keys must start with "pk_".');
      return;
    }

    setVariant(variantParam || 'standard');
    setConfig({
      publicKey,
      theme,
      language,
      apiUrl: 'https://growth.fenixblack.ai/api',
    });
  }, [searchParams]);

  // Send events to parent window
  const handleSuccess = (position: number) => {
    window.parent.postMessage({
      type: 'growthkit:waitlist:joined',
      data: { position },
    }, '*');
  };

  // Error state
  if (error) {
    return (
      <div style={{
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        fontSize: '14px',
      }}>
        <strong>GrowthKit Error:</strong> {error}
      </div>
    );
  }

  // Loading state
  if (!config) {
    return (
      <div style={{
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '16px',
          height: '16px',
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
    <GrowthKitProvider config={config}>
      <EmbedWaitlistWidget
        variant={variant}
        onSuccess={handleSuccess}
        style={{
          // Ensure widget fits in iframe
          width: '100%',
          maxWidth: '100%',
        }}
      />
    </GrowthKitProvider>
  );
}

export default function EmbedWaitlistPage() {
  return (
    <Suspense fallback={
      <div style={{
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        Loading...
      </div>
    }>
      <EmbedWaitlistContent />
    </Suspense>
  );
}

