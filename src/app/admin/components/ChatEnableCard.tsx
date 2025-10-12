'use client';

import { useState } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { MessageSquare } from 'lucide-react';

interface ChatEnableCardProps {
  appId: string;
  chatEnabled: boolean;
  onUpdate: () => void;
}

export function ChatEnableCard({ appId, chatEnabled, onUpdate }: ChatEnableCardProps) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const response = await fetch('/api/admin/chat/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          enabled: true,
          botName: 'Assistant',
          welcomeMessage: 'Hi! How can I help you today?'
        })
      });

      if (!response.ok) throw new Error('Failed to enable chat');
      
      // Reactively update parent component
      onUpdate();
    } catch (error) {
      console.error('Enable chat error:', error);
      alert('Failed to enable chat mode');
    } finally {
      setIsEnabling(false);
    }
  };

  if (chatEnabled) {
    return null; // Don't show if already enabled
  }

  return (
    <ContentCard title="🚀 Chat Mode (New!)">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Enable AI-Powered Chat</h3>
            <p className="text-gray-600 mb-4">
              Transform your widget into an intelligent chatbot that can:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>✓ Answer questions using your knowledge base (RAG)</li>
              <li>✓ Schedule meetings automatically</li>
              <li>✓ Qualify leads through conversation</li>
              <li>✓ Seamlessly hand off to you when needed</li>
            </ul>
            <Button 
              variant="primary" 
              onClick={handleEnable}
              disabled={isEnabling}
            >
              {isEnabling ? 'Enabling...' : 'Enable Chat Mode'}
            </Button>
          </div>
        </div>
      </div>
    </ContentCard>
  );
}

