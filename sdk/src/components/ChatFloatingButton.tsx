import React from 'react';
import { useGrowthKit } from '../useGrowthKit';

export interface ChatFloatingButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  credits: number;
  onClick: () => void;
  isOpen: boolean;
}

export const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({ 
  position = 'bottom-right',
  credits,
  onClick,
  isOpen
}) => {
  const { app } = useGrowthKit();
  const branding = app;

  // Don't hide the button when open - transform it instead

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        ...getPositionStyles(),
        zIndex: 9999,
        width: '60px',
        height: '60px',
        borderRadius: '30px',
        backgroundColor: branding?.primaryColor || '#3B82F6',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      <span style={{ fontSize: '24px' }}>
        {isOpen ? '✕' : '💬'}
      </span>
      {credits > 0 && (
        <span style={{ 
          fontSize: '10px', 
          fontWeight: 'bold',
          marginTop: '2px'
        }}>
          {credits}
        </span>
      )}
    </button>
  );
};

