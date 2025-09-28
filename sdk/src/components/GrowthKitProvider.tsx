'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GrowthKitConfig } from '../types';
import { GrowthKitStateProvider } from './GrowthKitStateProvider';
import { LocalizationContext, getTranslations, type Language } from '../localization';

const GrowthKitContext = createContext<{ 
  config: GrowthKitConfig;
  setLanguage?: (language: Language) => void;
} | undefined>(undefined);

interface GrowthKitProviderProps {
  children: React.ReactNode;
  config: GrowthKitConfig;
}

export function GrowthKitProvider({ children, config }: GrowthKitProviderProps) {
  // Initialize language from config, defaulting to 'en'
  const [currentLanguage, setCurrentLanguage] = useState<Language>(config.language || 'en');
  
  // Update language when config changes
  useEffect(() => {
    if (config.language && config.language !== currentLanguage) {
      setCurrentLanguage(config.language);
    }
  }, [config.language, currentLanguage]);
  
  // Function to update language programmatically
  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };
  
  // Get translations for current language
  const translations = getTranslations(currentLanguage);
  
  return (
    <GrowthKitContext.Provider value={{ config, setLanguage }}>
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
