'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface NavTheme {
  isDark: boolean;
  textColor: string;
  logoFilter: string;
  buttonStyle: 'light' | 'dark';
}

const defaultTheme: NavTheme = {
  isDark: false,
  textColor: 'text-gray-900',
  logoFilter: 'brightness(0)',
  buttonStyle: 'light'
};

export function useAdaptiveNav() {
  const [navTheme, setNavTheme] = useState<NavTheme>(defaultTheme);
  const pathname = usePathname();

  // Reset to default theme on route change
  useEffect(() => {
    setNavTheme(defaultTheme);
  }, [pathname]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -80px 0px', // Account for nav height
      threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const isDarkSection = sectionId === 'get-started' || 
                               entry.target.classList.contains('dark-section') ||
                               !!entry.target.querySelector('.bg-gradient-to-r.from-gray-900') ||
                               !!entry.target.querySelector('[style*="gray-900"]');
          
          setNavTheme({
            isDark: isDarkSection,
            textColor: isDarkSection ? 'text-white' : 'text-gray-900',
            logoFilter: isDarkSection ? 'brightness(0) invert(1)' : 'brightness(0)',
            buttonStyle: isDarkSection ? 'dark' : 'light'
          });
        }
      });
    }, observerOptions);

    // Observe all main sections
    const sections = document.querySelectorAll('section[id], .dark-section, .light-section');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [pathname]); // Re-run observer setup on route change

  return navTheme;
}
