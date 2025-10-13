import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    sentByHuman?: boolean;
    [key: string]: any;
  };
}

export interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

// Custom short relative time format
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return 'just now';
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update timestamps every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
      {messages.map((message) => {
        // Determine background color based on role and whether sent by human
        const isUser = message.role === 'user';
        const isHuman = message.metadata?.sentByHuman;
        
        let backgroundColor = '#ffffff'; // Default for bot messages
        let color = '#1f2937';
        let border = 'none';
        let timestampColor = '#6b7280'; // Gray for timestamp
        
        if (isUser) {
          backgroundColor = '#3B82F6';
          color = '#ffffff';
          timestampColor = '#dbeafe'; // Light blue for user message timestamps
        } else if (isHuman) {
          backgroundColor = '#d1fae5'; // Light green for human messages
          color = '#065f46'; // Dark green text
          border = '1px solid #6ee7b7'; // Green border
          timestampColor = '#059669'; // Green for human message timestamps
        }
        
        // Build sender label
        let senderLabel = '';
        if (isUser) {
          senderLabel = ' • You';
        } else if (isHuman) {
          senderLabel = ' • Human';
        }
        
        return (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              marginBottom: '12px'
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor,
                color,
                border,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              <div 
                className="chat-message"
                dangerouslySetInnerHTML={renderMarkdown(message.content)}
              />
              <div style={{
                fontSize: '11px',
                marginTop: '6px',
                color: timestampColor,
                opacity: 0.9
              }}>
                {formatRelativeTime(message.createdAt)}{senderLabel}
              </div>
            </div>
          </div>
        );
      })}
      
      {isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '12px'
        }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px'
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#9ca3af',
                    animation: `typing 1.4s infinite ${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
      
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        
        /* Markdown styling */
        .chat-message p {
          margin: 0 0 8px 0;
        }
        
        .chat-message p:last-child {
          margin-bottom: 0;
        }
        
        .chat-message strong {
          font-weight: 600;
        }
        
        .chat-message em {
          font-style: italic;
        }
        
        .chat-message code {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
        }
        
        .chat-message pre {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 10px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }
        
        .chat-message pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .chat-message ul, .chat-message ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .chat-message li {
          margin: 4px 0;
        }
        
        .chat-message a {
          color: inherit;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .chat-message blockquote {
          border-left: 3px solid rgba(0, 0, 0, 0.1);
          padding-left: 12px;
          margin: 8px 0;
          font-style: italic;
        }
        
        .chat-message h1, .chat-message h2, .chat-message h3, 
        .chat-message h4, .chat-message h5, .chat-message h6 {
          margin: 12px 0 8px 0;
          font-weight: 600;
        }
        
        .chat-message h1 { font-size: 1.5em; }
        .chat-message h2 { font-size: 1.3em; }
        .chat-message h3 { font-size: 1.1em; }
        
        .chat-message hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 12px 0;
        }

        /* Table styling */
        .chat-message table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .chat-message thead {
          background-color: #f3f4f6;
        }
        
        .chat-message th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #d1d5db;
          color: #374151;
        }
        
        .chat-message td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        
        .chat-message tbody tr:last-child td {
          border-bottom: none;
        }
        
        .chat-message tbody tr:hover {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
};

