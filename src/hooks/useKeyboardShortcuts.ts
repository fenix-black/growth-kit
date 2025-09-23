import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

const shortcuts: ShortcutConfig[] = [
  {
    key: 'd',
    ctrlOrCmd: true,
    shift: true,
    action: () => {
      const event = new CustomEvent('toggleTheme');
      window.dispatchEvent(event);
    },
    description: 'Toggle dark mode'
  },
  {
    key: '/',
    ctrlOrCmd: true,
    action: () => {
      const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    description: 'Focus search'
  },
  {
    key: 'n',
    ctrlOrCmd: true,
    action: () => {
      const router = useRouter();
      router.push('/admin/apps/new');
    },
    description: 'Create new app'
  }
];

export function useKeyboardShortcuts() {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Safety check for event.key
    if (!event.key) return;
    
    const isCmd = event.metaKey || event.ctrlKey;
    
    shortcuts.forEach(shortcut => {
      // Safety check for shortcut.key
      if (!shortcut.key) return;
      
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchesModifiers = 
        (!shortcut.ctrlOrCmd || isCmd) &&
        (!shortcut.shift || event.shiftKey) &&
        (!shortcut.alt || event.altKey);

      if (matchesKey && matchesModifiers) {
        event.preventDefault();
        
        // Special handling for router-based actions
        if (shortcut.key === 'n' && shortcut.ctrlOrCmd) {
          router.push('/admin/apps/new');
        } else {
          shortcut.action();
        }
      }
    });

    // Escape key to close modals
    if (event.key === 'Escape') {
      const closeButtons = document.querySelectorAll('button[aria-label*="Close"], button[aria-label*="close"]');
      const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLButtonElement;
      if (lastCloseButton) {
        lastCloseButton.click();
      }
    }
  }, [router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
