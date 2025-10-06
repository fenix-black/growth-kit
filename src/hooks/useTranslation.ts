'use client';

import { useState, useEffect } from 'react';
import { Language, getLanguageFromCookie, setLanguageCookie } from '@/lib/language';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

const translations = {
  en: enTranslations,
  es: esTranslations,
};

export function useTranslation() {
  // Initialize with null to prevent hydration mismatch
  const [language, setLanguage] = useState<Language | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check cookie first, then browser language
    const savedLang = getLanguageFromCookie();
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      // Auto-detect from browser on first visit
      const browserLang = navigator.language.toLowerCase().includes('es') ? 'es' : 'en';
      setLanguage(browserLang);
      setLanguageCookie(browserLang);
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setLanguageCookie(newLang);
  };

  /**
   * Translate a key using dot notation
   * Example: t('hero.title') -> "Intelligent Waitlist & Referral Management"
   */
  const t = (key: string): string => {
    // Use English as fallback during SSR or before client hydration
    const currentLang = language || 'en';
    const keys = key.split('.');
    let value: any = translations[currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Return key if translation not found
  };

  return { 
    language: language || 'en', 
    changeLanguage, 
    t,
    isClient // Export for components that need to know if we're client-side
  };
}
