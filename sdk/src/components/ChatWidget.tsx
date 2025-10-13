import React, { useState, useEffect, useRef } from 'react';
import { useGrowthKit } from '../useGrowthKit';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatPanel } from './ChatPanel';

export interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  position = 'bottom-right' 
}) => {
  const { policy, app, credits, track } = useGrowthKit();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const handleOpen = () => {
    setIsOpen(true);
    track('chat_opened', { sessionId });
  };

  const handleClose = () => {
    setIsOpen(false);
    track('chat_closed', { sessionId });
  };

  if (!policy || !app) {
    return null;
  }

  return (
    <>
      <ChatFloatingButton
        position={position}
        onClick={isOpen ? handleClose : handleOpen}
        isOpen={isOpen}
      />
      
      {isOpen && (
        <ChatPanel
          position={position}
          sessionId={sessionId}
          onClose={handleClose}
        />
      )}
    </>
  );
};

