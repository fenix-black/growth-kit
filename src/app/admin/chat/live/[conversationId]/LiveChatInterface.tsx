'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  status: string;
  fingerprint?: {
    browser?: string;
    device?: string;
  };
}

export function LiveChatInterface({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch conversation and messages
  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}`);
      const data = await response.json();
      
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for new messages
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: input
        })
      });

      if (!response.ok) throw new Error('Failed to send');

      setInput('');
      fetchData(); // Refresh messages
    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm('Release conversation back to AI?')) return;

    try {
      const response = await fetch('/api/admin/chat/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) throw new Error('Failed to release');

      alert('Conversation released to AI');
      router.back();
    } catch (error) {
      console.error('Release error:', error);
      alert('Failed to release conversation');
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading conversation...</div>;
  }

  if (!conversation) {
    return <div className="p-8">Conversation not found</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Live Chat</h1>
          <p className="text-sm text-gray-500">
            {conversation.fingerprint?.browser} • {conversation.fingerprint?.device}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleRelease}>
            Release to AI
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.metadata?.sentByHuman
                  ? 'bg-green-100 text-gray-900 border border-green-300'
                  : 'bg-white text-gray-900 border'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                {message.metadata?.sentByHuman && ' • You'}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg"
            rows={2}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

