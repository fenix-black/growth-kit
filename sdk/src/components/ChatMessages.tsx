import React, { useEffect, useRef } from 'react';

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

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          >
            {message.content}
          </div>
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
      `}</style>
    </div>
  );
};

