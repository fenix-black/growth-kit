'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GrowthKitProvider } from '../../../sdk/src/components/GrowthKitProvider';
import { useGrowthKit } from '../../../sdk/src/useGrowthKit';
import { EmbedWaitlistWidget } from '../../../sdk/src/components/EmbedWaitlistWidget';
import { ChatWidget } from '../../../sdk/src/components/ChatWidget';
import { useGrowthKitConfig } from '../../../sdk/src/components/GrowthKitProvider';
import type { GrowthKitConfig, GrowthKitTheme } from '../../../sdk/src/types';

/**
 * Smart Embed Page
 * 
 * Automatically shows the appropriate widget based on app configuration:
 * - If chat enabled → ChatWidget
 * - If waitlist enabled & user not joined → WaitlistForm
 * - Otherwise → minimal (nothing to show)
 * 
 * URL Parameters:
 * - pk: Public key (required)
 * - theme: 'light' | 'dark' | 'auto' (default: 'auto')
 * - lang: 'en' | 'es' (default: 'en')
 * - position: For chat: 'bottom-right' | 'bottom-left' (default: 'bottom-right')
 */

// Inner component that uses the GrowthKit context
function SmartWidget({ position }: { position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' }) {
  const { 
    loading, 
    initialized, 
    shouldShowWaitlist,
    app,
  } = useGrowthKit();
  
  const { config } = useGrowthKitConfig();
  const [chatEnabled, setChatEnabled] = useState(false);
  const [mode, setMode] = useState<'loading' | 'chat' | 'waitlist' | 'none'>('loading');

  // Check chat config
  useEffect(() => {
    const checkChatConfig = async () => {
      if (!initialized) return;
      
      try {
        const { GrowthKitAPI } = await import('../../../sdk/src/api');
        const api = new GrowthKitAPI(config.apiKey, config.publicKey, config.apiUrl);
        const chatConfig = await api.getChatConfig();
        setChatEnabled(chatConfig?.enabled || false);
      } catch {
        setChatEnabled(false);
      }
    };
    
    checkChatConfig();
  }, [initialized, config]);

  // Determine mode and notify parent
  useEffect(() => {
    if (loading || !initialized) {
      setMode('loading');
      return;
    }

    let newMode: typeof mode;
    
    if (chatEnabled) {
      newMode = 'chat';
    } else if (shouldShowWaitlist) {
      newMode = 'waitlist';
    } else {
      newMode = 'none';
    }
    
    setMode(newMode);
    
    // Notify parent iframe about the mode
    window.parent.postMessage({
      type: 'growthkit:mode',
      mode: newMode,
    }, '*');
  }, [loading, initialized, chatEnabled, shouldShowWaitlist]);

  // Loading state
  if (mode === 'loading') {
    return (
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#6b7280',
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #e5e7eb',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Chat mode - full viewport for floating widget
  if (mode === 'chat') {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <ChatWidget position={position} />
      </div>
    );
  }

  // Waitlist mode - inline form
  if (mode === 'waitlist') {
    return (
      <EmbedWaitlistWidget
        onSuccess={(position) => {
          window.parent.postMessage({
            type: 'growthkit:waitlist:joined',
            data: { position },
          }, '*');
        }}
      />
    );
  }

  // Nothing to show
  return null;
}

export default function SmartEmbedPage() {
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
    
    // Use same origin for API in development
    const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? `${window.location.origin}/api`
      : 'https://growth.fenixblack.ai/api';
    
    setConfig({
      publicKey,
      theme,
      language,
      apiUrl,
    });
  }, [searchParams]);

  if (error) {
    return (
      <div style={{
        padding: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        fontSize: '13px',
      }}>
        <strong>GrowthKit Error:</strong> {error}
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <GrowthKitProvider config={config}>
      <SmartWidget position={position} />
    </GrowthKitProvider>
  );
}

