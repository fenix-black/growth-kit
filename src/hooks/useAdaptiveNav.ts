'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface NavTheme {
  isDark: boolean;
  textColor: string;
  logoFilter: string;
  buttonStyle: 'light' | 'dark';
}

const lightTheme: NavTheme = {
  isDark: false,
  textColor: 'text-gray-900',
  logoFilter: 'brightness(0)',
  buttonStyle: 'light'
};

const darkTheme: NavTheme = {
  isDark: true,
  textColor: 'text-white',
  logoFilter: 'brightness(0) invert(1)',
  buttonStyle: 'dark'
};

// Check point: around logo position, middle of header height
const CHECK_X = 120; // Around logo position
const CHECK_Y = 32;  // Middle of header (64px / 2)

export function useAdaptiveNav() {
  const [navTheme, setNavTheme] = useState<NavTheme>(lightTheme);
  const pathname = usePathname();
  const rafRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  // Find the header element to exclude it from detection
  useEffect(() => {
    headerRef.current = document.querySelector('header, nav, [role="navigation"]');
  }, [pathname]);

  // Check if an element or any of its ancestors has a dark-section class
  const hasDarkAncestor = useCallback((element: Element | null): boolean => {
    let current = element;
    while (current && current !== document.body) {
      if (current.id === 'get-started' || current.classList.contains('dark-section')) {
        return true;
      }
      // Also check for light-section to explicitly return false
      if (current.classList.contains('light-section')) {
        return false;
      }
      current = current.parentElement;
    }
    return false;
  }, []);

  // Get the element behind the header at the check point
  const getElementBehindHeader = useCallback((): Element | null => {
    // Temporarily hide the header to get what's behind it
    const header = headerRef.current;
    const originalPointerEvents = header?.style.pointerEvents;
    
    if (header) {
      header.style.pointerEvents = 'none';
    }

    // Get element at the check point
    const element = document.elementFromPoint(CHECK_X, CHECK_Y);

    // Restore header
    if (header) {
      header.style.pointerEvents = originalPointerEvents || '';
    }

    return element;
  }, []);

  // Update theme based on what's behind the header
  const updateTheme = useCallback(() => {
    const element = getElementBehindHeader();
    
    if (element && hasDarkAncestor(element)) {
      setNavTheme(darkTheme);
    } else {
      setNavTheme(lightTheme);
    }
  }, [getElementBehindHeader, hasDarkAncestor]);

  // Throttled scroll handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(updateTheme);
  }, [updateTheme]);

  // Set up scroll listener and initial check
  useEffect(() => {
    // Initial check
    updateTheme();
    
    // Also check after a short delay for hydration
    const timer = setTimeout(updateTheme, 50);

    // Listen to scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [pathname, handleScroll, updateTheme]);

  return navTheme;
}
