'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GrowthKitConfig, GrowthKitTheme } from '../types';
import { GrowthKitStateProvider } from './GrowthKitStateProvider';
import { AutoWaitlistInjector } from './AutoWaitlistInjector';
import { LocalizationContext, getTranslations, type Language } from '../localization';
import { getEffectiveTheme, onSystemThemeChange, type ThemeColors, getThemeColors } from '../theme';
import { checkForUpdates, getCurrentVersion, getSdkLoadSource } from '../sdkLoader';

const GrowthKitContext = createContext<{ 
  config: GrowthKitConfig;
  setLanguage?: (language: Language) => void;
  currentLanguage: Language;
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
  // Apply default apiUrl if not provided
  // When using publicKey mode, default to production API
  // This ensures widgets that make direct fetch calls (like ProductWaitlistWidget) work correctly
  const normalizedConfig: GrowthKitConfig = {
    ...config,
    apiUrl: config.apiUrl || (config.publicKey ? 'https://growth.fenixblack.ai/api' : config.apiUrl),
  };
  
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
  
  // Auto-update check (passive - logs but doesn't reload yet)
  useEffect(() => {
    // Only check if auto-update is explicitly enabled
    if (!normalizedConfig.autoUpdate) {
      return;
    }
    
    const checkInterval = normalizedConfig.updateCheckTTL || 120000; // 2 min default
    const updateDebug = normalizedConfig.updateDebug ?? normalizedConfig.debug ?? false;
    
    if (updateDebug) {
      console.log('[GrowthKit] Auto-update enabled:', {
        currentVersion: getCurrentVersion(),
        loadSource: getSdkLoadSource(),
        checkInterval: `${checkInterval}ms`,
      });
    }
    
    const performCheck = async () => {
      const result = await checkForUpdates({
        enabled: true,
        apiUrl: normalizedConfig.apiUrl || 'https://growth.fenixblack.ai/api',
        cacheTTL: checkInterval,
        timeout: normalizedConfig.updateTimeout || 3000,
        debug: updateDebug,
      });
      
      if (result.hasUpdate) {
        if (updateDebug) {
          console.log('[GrowthKit] Update available:', {
            current: result.currentVersion,
            latest: result.latestVersion,
            forceUpdate: result.forceUpdate,
          });
        }
        
        if (result.forceUpdate) {
          console.warn(
            `[GrowthKit] IMPORTANT: A critical SDK update is available. ` +
            `Current: ${result.currentVersion}, Latest: ${result.latestVersion}. ` +
            `Please refresh the page to load the latest version.`
          );
        }
      }
    };
    
    // Initial check
    performCheck();
    
    // Periodic checks
    const intervalId = setInterval(performCheck, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [normalizedConfig.autoUpdate, normalizedConfig.apiUrl, normalizedConfig.updateCheckTTL, normalizedConfig.updateTimeout, normalizedConfig.updateDebug, normalizedConfig.debug]);
  
  return (
    <GrowthKitContext.Provider value={{ 
      config: normalizedConfig, 
      setLanguage,
      currentLanguage,
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
          <AutoWaitlistInjector />
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

