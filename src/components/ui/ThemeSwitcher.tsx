'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from './utils';

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleToggleTheme() {
      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
      const currentIndex = themes.indexOf(theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      setTheme(themes[nextIndex]);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('toggleTheme', handleToggleTheme);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('toggleTheme', handleToggleTheme);
    };
  }, [theme, setTheme]);

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-md transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'text-gray-700 dark:text-gray-300'
        )}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className={cn(
          'absolute bottom-full mb-2 left-0 w-40 rounded-md shadow-lg',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'z-[100]'
        )}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center w-full px-4 py-2 text-sm',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'text-gray-700 dark:text-gray-300',
                  theme === option.value && 'bg-gray-50 dark:bg-gray-700'
                )}
              >
                <option.icon className="mr-3 h-4 w-4" />
                {option.label}
                {theme === option.value && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
