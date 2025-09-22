import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      previouslyFocused?.focus();
    };
  }, [isActive]);

  return containerRef;
}

export function useAutoFocus(shouldFocus: boolean = true) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      const timer = setTimeout(() => {
        elementRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shouldFocus]);

  return elementRef;
}

export function useArrowNavigation(
  items: any[],
  isActive: boolean = true,
  onSelect?: (item: any, index: number) => void
) {
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let newIndex = selectedIndexRef.current;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(items.length - 1, selectedIndexRef.current + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(0, selectedIndexRef.current - 1);
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (onSelect && items[selectedIndexRef.current]) {
            onSelect(items[selectedIndexRef.current], selectedIndexRef.current);
          }
          return;
        default:
          return;
      }

      selectedIndexRef.current = newIndex;

      // Update focus
      const elements = document.querySelectorAll('[data-arrow-nav-item]');
      const element = elements[newIndex] as HTMLElement;
      element?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, isActive, onSelect]);

  return selectedIndexRef;
}
