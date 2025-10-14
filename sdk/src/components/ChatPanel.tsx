import React, { useState, useEffect, useRef } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { GrowthKitAPI } from '../api';

export interface ChatPanelProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  sessionId: string;
  onClose: () => void;
}

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

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  position = 'bottom-right',
  sessionId,
  onClose
}) => {
  const { app, credits, api } = useGrowthKit();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPoll, setLastPoll] = useState<string | null>(null);
  const [chatConfig, setChatConfig] = useState<{ botName?: string; welcomeMessage?: string } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const branding = app;

  // Fetch chat config and initialize with welcome message
  useEffect(() => {
    const fetchConfig = async () => {
      if (!api) return;
      
      try {
        const config = await api.getChatConfig();
        setChatConfig(config);
        
        // Add welcome message initially - will be replaced by real messages if conversation exists
        if (config.enabled && config.welcomeMessage) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: config.welcomeMessage,
            createdAt: new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Failed to fetch chat config:', error);
        // Fallback welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Hi! How can I help you today?',
          createdAt: new Date().toISOString()
        }]);
      }
    };

    fetchConfig();
  }, [api]);

  // Use API directly from hook

  // Polling for new messages
  useEffect(() => {
    if (!api) return;

    const poll = async () => {
      // Capture the initial load state at the start of this poll
      const wasInitialLoad = isInitialLoad;
      
      // Mark initial load as complete immediately (before the async call)
      // This prevents duplicate messages when user sends while isInitialLoad is true
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      try {
        const since = lastPoll || null;
        const response = await api.pollChatMessages(sessionId, since);
        if (response && response.messages && response.messages.length > 0) {
          // Always merge messages, never replace (to preserve client-side welcome message)
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = response.messages.filter(
              (msg: Message) => {
                // Skip if message already exists
                if (existingIds.has(msg.id)) return false;
                
                // On initial load, include all messages (user + bot) to load history
                // After initial load, skip user messages (they're added optimistically)
                if (wasInitialLoad) return true;
                return msg.role !== 'user';
              }
            );
            return [...prev, ...newMessages as Message[]];
          });
          
          if (response.messages.length > 0) {
            setLastPoll(response.messages[response.messages.length - 1].createdAt);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollInterval.current = setInterval(poll, 2000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [sessionId, lastPoll, api]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !api) {
      console.log('Cannot send message:', { content: content.trim(), api: !!api });
      return;
    }

    console.log('Sending message:', content);

    // Once user sends first message, we're no longer in initial load mode
    setIsInitialLoad(false);

    // Add user message immediately for instant feedback
    // Bot response will come via polling
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(sessionId, content);
      console.log('Send message response:', response);
      
      // Bot response will be fetched by polling
      // User message is already shown above
    } catch (error) {
      console.error('Send message error:', error);
      // Remove the user message we added optimistically
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      // Show error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, something went wrong. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9998,
      width: '400px',
      height: 'min(70vh, 600px)',
      minHeight: '400px',
      maxHeight: 'calc(100vh - 120px)',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '90px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '90px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '90px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '90px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '90px', right: '20px' };
    }
  };

  return (
    <div style={getPositionStyles()}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: branding?.primaryColor || '#3B82F6',
        color: '#ffffff'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {chatConfig?.botName || 'Assistant'}
          </h3>
          {credits > 0 && (
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              {credits} credits
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};

