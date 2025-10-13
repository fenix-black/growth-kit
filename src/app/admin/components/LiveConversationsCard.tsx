'use client';

import { useState, useEffect } from 'react';
import { App } from '@prisma/client';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { getMessagePreview } from '@/lib/utils/markdown';

interface Conversation {
  id: string;
  sessionId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
  messages: Array<{
    content: string;
    role: string;
    createdAt: string;
  }>;
  fingerprint?: {
    browser?: string;
    device?: string;
  };
}

interface LiveConversationsCardProps {
  app: App;
}

export function LiveConversationsCard({ app }: LiveConversationsCardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/admin/chat/conversations?appId=${app.id}&status=active`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [app.id]);

  const handleTakeOver = async (conversationId: string) => {
    try {
      const response = await fetch('/api/admin/chat/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) throw new Error('Failed to take over');

      // Navigate to live chat interface
      router.push(`/admin/chat/live/${conversationId}`);
    } catch (error) {
      console.error('Takeover error:', error);
      alert('Failed to take over conversation');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      taken_over: 'bg-blue-100 text-blue-800',
      ended: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.active}`}>
        {status}
      </span>
    );
  };

  return (
    <ContentCard title={`Live Conversations (${conversations.filter(c => c.status === 'active').length} active)`}>
      <div>
        {isLoading ? (
          <p className="text-gray-500">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="text-gray-500">No active conversations</p>
        ) : (
          <div className="space-y-3">
            {conversations.map(conv => (
              <div key={conv.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(conv.status)}
                      <span className="text-sm text-gray-500">
                        {conv.fingerprint?.browser} • {conv.fingerprint?.device}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {conv.messages[0]?.content ? getMessagePreview(conv.messages[0].content, 150) : 'No messages yet'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                    </span>
                    {conv.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handleTakeOver(conv.id)}
                      >
                        Take Over
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {conv._count.messages} messages
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentCard>
  );
}

