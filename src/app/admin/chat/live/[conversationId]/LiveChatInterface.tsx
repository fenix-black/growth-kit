'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { marked } from 'marked';

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

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function LiveChatInterface({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Render markdown for a message
  const renderMarkdown = (content: string) => {
    try {
      const html = marked.parse(content) as string;
      return { __html: html };
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return { __html: content };
    }
  };

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
              <div 
                className="text-sm admin-chat-message"
                dangerouslySetInnerHTML={renderMarkdown(message.content)}
              />
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

      {/* Markdown Styling */}
      <style jsx>{`
        .admin-chat-message p {
          margin: 0 0 8px 0;
        }
        
        .admin-chat-message p:last-child {
          margin-bottom: 0;
        }
        
        .admin-chat-message strong {
          font-weight: 600;
        }
        
        .admin-chat-message em {
          font-style: italic;
        }
        
        .admin-chat-message code {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
        }
        
        .admin-chat-message pre {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 10px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }
        
        .admin-chat-message pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .admin-chat-message ul, .admin-chat-message ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .admin-chat-message li {
          margin: 4px 0;
        }
        
        .admin-chat-message a {
          color: #3B82F6;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .admin-chat-message blockquote {
          border-left: 3px solid rgba(0, 0, 0, 0.1);
          padding-left: 12px;
          margin: 8px 0;
          font-style: italic;
        }
        
        .admin-chat-message h1, .admin-chat-message h2, .admin-chat-message h3, 
        .admin-chat-message h4, .admin-chat-message h5, .admin-chat-message h6 {
          margin: 12px 0 8px 0;
          font-weight: 600;
        }
        
        .admin-chat-message h1 { font-size: 1.5em; }
        .admin-chat-message h2 { font-size: 1.3em; }
        .admin-chat-message h3 { font-size: 1.1em; }
        
        .admin-chat-message hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 12px 0;
        }

        /* Table styling */
        .admin-chat-message table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .admin-chat-message thead {
          background-color: #f3f4f6;
        }
        
        .admin-chat-message th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #d1d5db;
          color: #374151;
        }
        
        .admin-chat-message td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        
        .admin-chat-message tbody tr:last-child td {
          border-bottom: none;
        }
        
        .admin-chat-message tbody tr:hover {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}

