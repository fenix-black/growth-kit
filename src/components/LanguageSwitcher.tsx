'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="flex items-center text-sm">
      <button
        onClick={() => changeLanguage('en')}
        className={`font-medium transition-colors duration-200 ${
          language === 'en' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="mx-2 text-gray-300">|</span>
      <button
        onClick={() => changeLanguage('es')}
        className={`font-medium transition-colors duration-200 ${
          language === 'es' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
}
