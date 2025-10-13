import React, { useState, useRef, KeyboardEvent } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      
      // Reset textarea height and refocus
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        // Focus back on the input for quick follow-up messages
        // Use requestAnimationFrame for better timing after DOM updates
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{
      padding: '16px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-end'
    }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        style={{
          flex: 1,
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'none',
          minHeight: '42px',
          maxHeight: '120px',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3B82F6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: (!input.trim() || disabled) ? 0.5 : 1,
          transition: 'opacity 0.2s'
        }}
      >
        Send
      </button>
    </div>
  );
};

