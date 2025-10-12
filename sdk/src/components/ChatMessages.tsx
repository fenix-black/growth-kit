import React, { useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
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

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '12px'
          }}
        >
          <div
            className="chat-message"
            style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: message.role === 'user' ? '#3B82F6' : '#ffffff',
              color: message.role === 'user' ? '#ffffff' : '#1f2937',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              wordBreak: 'break-word',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
            dangerouslySetInnerHTML={renderMarkdown(message.content)}
          />
        </div>
      ))}
      
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
      `}</style>
    </div>
  );
};

