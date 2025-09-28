'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GrowthKitConfig, GrowthKitTheme } from '../types';
import { GrowthKitStateProvider } from './GrowthKitStateProvider';
import { LocalizationContext, getTranslations, type Language } from '../localization';
import { getEffectiveTheme, onSystemThemeChange, type ThemeColors, getThemeColors } from '../theme';

const GrowthKitContext = createContext<{ 
  config: GrowthKitConfig;
  setLanguage?: (language: Language) => void;
  theme: GrowthKitTheme;
  effectiveTheme: 'light' | 'dark';
  themeColors: ThemeColors;
  setTheme?: (theme: GrowthKitTheme) => void;
} | undefined>(undefined);

interface GrowthKitProviderProps {
  children: React.ReactNode;
  config: GrowthKitConfig;
}

export function GrowthKitProvider({ children, config }: GrowthKitProviderProps) {
  // Initialize language from config, defaulting to 'en'
  const [currentLanguage, setCurrentLanguage] = useState<Language>(config.language || 'en');
  
  // Initialize theme from config, defaulting to 'auto'
  const [currentTheme, setCurrentTheme] = useState<GrowthKitTheme>(config.theme || 'auto');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => 
    getEffectiveTheme(config.theme || 'auto')
  );
  
  // Update language when config changes
  useEffect(() => {
    if (config.language && config.language !== currentLanguage) {
      setCurrentLanguage(config.language);
    }
  }, [config.language, currentLanguage]);
  
  // Update theme when config changes
  useEffect(() => {
    if (config.theme && config.theme !== currentTheme) {
      setCurrentTheme(config.theme);
      setEffectiveTheme(getEffectiveTheme(config.theme));
    }
  }, [config.theme, currentTheme]);
  
  // Listen to system theme changes when using 'auto'
  useEffect(() => {
    if (currentTheme !== 'auto') return;
    
    const cleanup = onSystemThemeChange((isDark) => {
      setEffectiveTheme(isDark ? 'dark' : 'light');
    });
    
    return cleanup;
  }, [currentTheme]);
  
  // Function to update language programmatically
  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };
  
  // Function to update theme programmatically
  const setTheme = (theme: GrowthKitTheme) => {
    setCurrentTheme(theme);
    setEffectiveTheme(getEffectiveTheme(theme));
  };
  
  // Get translations for current language
  const translations = getTranslations(currentLanguage);
  
  // Get theme colors for effective theme (resolved from 'auto' if needed)
  const themeColors = getThemeColors(effectiveTheme);
  
  return (
    <GrowthKitContext.Provider value={{ 
      config, 
      setLanguage,
      theme: currentTheme,
      effectiveTheme,
      themeColors,
      setTheme
    }}>
      <LocalizationContext.Provider value={{ 
        language: currentLanguage, 
        t: translations, 
        setLanguage 
      }}>
        <GrowthKitStateProvider>
          {children}
        </GrowthKitStateProvider>
      </LocalizationContext.Provider>
    </GrowthKitContext.Provider>
  );
}

export function useGrowthKitConfig() {
  const context = useContext(GrowthKitContext);
  if (!context) {
    throw new Error('useGrowthKitConfig must be used within a GrowthKitProvider');
  }
  return context;
}

