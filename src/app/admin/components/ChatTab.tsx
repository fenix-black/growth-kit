'use client';

import { App, ChatConfiguration } from '@prisma/client';
import { ChatSettingsCard } from './ChatSettingsCard';
import { KnowledgeBaseCard } from './KnowledgeBaseCard';
import { CalendarSettingsCard } from './CalendarSettingsCard';
import { LiveConversationsCard } from './LiveConversationsCard';

interface ChatTabProps {
  app: App & { chatConfig?: ChatConfiguration | null };
}

export function ChatTab({ app }: ChatTabProps) {
  return (
    <div className="space-y-6">
      <ChatSettingsCard app={app} />
      <KnowledgeBaseCard app={app} />
      <CalendarSettingsCard app={app} />
      <LiveConversationsCard app={app} />
    </div>
  );
}

