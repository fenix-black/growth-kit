// Simple language detection utility (no external packages needed)
// Following KISS principles for just 2 languages

export type Language = 'en' | 'es';

/**
 * Detect browser language from Accept-Language header
 * Simple check: if Spanish is present, use Spanish, otherwise English
 */
export function detectBrowserLanguage(acceptLanguage: string | null): Language {
  if (!acceptLanguage) return 'en';
  
  // Simple check: if Spanish is in Accept-Language header, use Spanish
  const lang = acceptLanguage.toLowerCase();
  return lang.includes('es') ? 'es' : 'en';
}

/**
 * Get language preference from cookie
 * Returns null if cookie doesn't exist
 */
export function getLanguageFromCookie(): Language | null {
  if (typeof document === 'undefined') return null;
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='));
  
  return cookie ? (cookie.split('=')[1] as Language) : null;
}

/**
 * Set language preference in cookie
 * Cookie expires in 1 year
 */
export function setLanguageCookie(language: Language): void {
  document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`; // 1 year
}
