'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="relative inline-flex bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full p-1 shadow-sm">
      <button
        onClick={() => changeLanguage('en')}
        className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-1.5 ${
          language === 'en' 
            ? 'text-white' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="Switch to English"
      >
        {language === 'en' && (
          <motion.div
            layoutId="activeLanguage"
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(to right, #10b981, #14b8a6)',
            }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 text-base">🇺🇸</span>
        <span className="relative z-10">EN</span>
      </button>
      <button
        onClick={() => changeLanguage('es')}
        className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-1.5 ${
          language === 'es' 
            ? 'text-white' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="Cambiar a Español"
      >
        {language === 'es' && (
          <motion.div
            layoutId="activeLanguage"
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(to right, #10b981, #14b8a6)',
            }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 text-base">🇪🇸</span>
        <span className="relative z-10">ES</span>
      </button>
    </div>
  );
}
