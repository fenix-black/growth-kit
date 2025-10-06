'use client';

import { useLanguageContext } from '@/contexts/LanguageContext';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

const translations = {
  en: enTranslations,
  es: esTranslations,
};

export function useTranslation() {
  const { language, changeLanguage } = useLanguageContext();

  /**
   * Translate a key using dot notation
   * Example: t('hero.title') -> "Intelligent Waitlist & Referral Management"
   */
  const t = (key: string): any => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Return key if translation not found
  };

  return { language, changeLanguage, t };
}
