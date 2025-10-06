'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getLanguageFromCookie, setLanguageCookie } from '@/lib/language';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
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

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}

