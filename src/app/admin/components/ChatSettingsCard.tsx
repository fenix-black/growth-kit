'use client';

import { useState } from 'react';
import { App, ChatConfiguration } from '@prisma/client';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';

interface ChatSettingsCardProps {
  app: App & { chatConfig?: ChatConfiguration | null };
}

export function ChatSettingsCard({ app }: ChatSettingsCardProps) {
  const [config, setConfig] = useState(app.chatConfig || {
    enabled: true,
    botName: 'Assistant',
    systemPrompt: '',
    welcomeMessage: 'Hi! How can I help you today?'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/chat/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.id,
          ...config
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      
      alert('Chat settings saved successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentCard title="Chat Settings">
      <div className="space-y-4">
        <div>
          <label htmlFor="botName" className="block text-sm font-medium mb-2">Bot Name</label>
          <input
            id="botName"
            type="text"
            value={config.botName}
            onChange={(e) => setConfig({ ...config, botName: e.target.value })}
            placeholder="Assistant"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="welcomeMessage" className="block text-sm font-medium mb-2">Welcome Message</label>
          <input
            id="welcomeMessage"
            type="text"
            value={config.welcomeMessage || ''}
            onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
            placeholder="Hi! How can I help you today?"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-medium mb-2">System Prompt (Advanced)</label>
          <textarea
            id="systemPrompt"
            value={config.systemPrompt || ''}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant for [your company]..."
            rows={6}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Leave empty to use default prompt
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </ContentCard>
  );
}

