'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from './utils';

interface SmartLogoProps {
  collapsed: boolean;
  className?: string;
}

export default function SmartLogo({ collapsed, className }: SmartLogoProps) {
  const { resolvedTheme } = useTheme();
  
  // Determine which logo to use
  const getLogoSrc = () => {
    if (collapsed) {
      // Always use icon when collapsed regardless of theme
      return '/growthkit-logo-icon-alpha.png';
    }
    
    // Use theme-appropriate logo when expanded
    return resolvedTheme === 'dark' 
      ? '/growthkit-logo-dark-alpha.png'
      : '/growthkit-logo-alpha.png';
  };

  const logoSrc = getLogoSrc();
  
  return (
    <Image
      src={logoSrc}
      alt="GrowthKit"
      width={collapsed ? 40 : 150}
      height={collapsed ? 40 : 40}
      className={cn(
        "object-contain transition-all duration-200",
        collapsed ? "mx-auto" : "",
        className
      )}
      priority
    />
  );
}
