import React from 'react';

interface LanguageIndicatorProps {
  preferredLanguage: string | null;
  browserLanguage?: string | null;
  languageSource?: string | null;
  className?: string;
  showTooltip?: boolean;
}

const getLanguageDisplay = (lang: string | null) => {
  if (!lang) return { flag: '🌐', code: 'N/A' };
  
  switch (lang.toLowerCase()) {
    case 'en':
      return { flag: '🇺🇸', code: 'EN' };
    case 'es':
      return { flag: '🇪🇸', code: 'ES' };
    default:
      return { flag: '🌐', code: lang.toUpperCase() };
  }
};

export function LanguageIndicator({ 
  preferredLanguage, 
  browserLanguage, 
  languageSource,
  className = '',
  showTooltip = false 
}: LanguageIndicatorProps) {
  const display = getLanguageDisplay(preferredLanguage);
  
  const tooltipContent = showTooltip && browserLanguage ? 
    `Browser: ${browserLanguage}, Preferred: ${preferredLanguage || 'Not set'}` : 
    null;

  return (
    <div 
      className={`flex items-center space-x-1.5 ${className}`}
      title={tooltipContent || undefined}
    >
      <span className="text-sm">{display.flag}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {display.code}
      </span>
      {languageSource === 'browser_detected' && (
        <span className="text-xs text-gray-400">*</span>
      )}
    </div>
  );
}
