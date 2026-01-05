'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GrowthKitProvider } from '../../../../sdk/src/components/GrowthKitProvider';
import { ChatWidget } from '../../../../sdk/src/components/ChatWidget';
import type { GrowthKitConfig, GrowthKitTheme } from '../../../../sdk/src/types';

/**
 * Embedded Chat Widget Page
 * 
 * URL Parameters:
 * - pk: Public key (required)
 * - theme: 'light' | 'dark' | 'auto' (default: 'auto')
 * - lang: 'en' | 'es' (default: 'en')
 * - position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' (default: 'bottom-right')
 * 
 * Example:
 * /embed/chat?pk=pk_xxx&theme=dark&lang=es&position=bottom-left
 */
export default function EmbedChatPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<GrowthKitConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

  useEffect(() => {
    const publicKey = searchParams.get('pk');
    const theme = (searchParams.get('theme') as GrowthKitTheme) || 'auto';
    const language = (searchParams.get('lang') as 'en' | 'es') || 'en';
    const positionParam = searchParams.get('position') as typeof position;
    
    if (!publicKey) {
      setError('Missing public key. Add ?pk=your_public_key to the URL.');
      return;
    }

    if (!publicKey.startsWith('pk_')) {
      setError('Invalid public key format. Public keys must start with "pk_".');
      return;
    }

    if (positionParam && ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(positionParam)) {
      setPosition(positionParam);
    }
    
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
      {/* 
        For chat widget in iframe, we need a full-height container
        The chat widget positions itself fixed, which works in the iframe context
      */}
      <div style={{ 
        width: '100vw', 
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <ChatWidget position={position} />
      </div>
    </GrowthKitProvider>
  );
}

