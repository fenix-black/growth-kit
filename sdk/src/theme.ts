import type { GrowthKitTheme } from './types';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundGlass: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderFocus: string;
  
  // Brand colors (following GrowthKit + FenixBlack theme)
  primary: string;
  primaryGradient: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // FenixBlack accent colors
  magenta: string;
  purple: string;
  violet: string;
  orange: string;
  pink: string;
  
  // Shadows and effects
  shadow: string;
  shadowSm: string;
  shadowLg: string;
  
  // Interactive states
  hover: string;
  active: string;
  
  // Input specific colors
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  inputFocus: string;
  
  // Modal specific colors
  overlay: string;
}

export const lightTheme: ThemeColors = {
  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundGlass: 'rgba(255, 255, 255, 0.95)',
  
  // Text colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderFocus: '#10b981',
  
  // Brand colors (GrowthKit + FenixBlack)
  primary: '#10b981',
  primaryGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
  secondary: '#14b8a6',
  accent: '#06b6d4',
  
  // Status colors
  success: '#10b981',
  warning: '#f97316',
  error: '#ef4444',
  
  // FenixBlack accent colors
  magenta: '#d946ef',
  purple: '#a855f7',
  violet: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  
  // Shadows and effects
  shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowSm: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
  
  // Interactive states
  hover: 'rgba(16, 185, 129, 0.05)',
  active: 'rgba(16, 185, 129, 0.1)',
  
  // Input specific colors
  inputBackground: 'rgba(255, 255, 255, 0.8)',
  inputBorder: '#e2e8f0',
  inputPlaceholder: '#94a3b8',
  inputFocus: 'rgba(16, 185, 129, 0.1)',
  
  // Modal specific colors
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const darkTheme: ThemeColors = {
  // Background colors
  background: '#1e293b',
  backgroundSecondary: '#334155',
  backgroundGlass: 'rgba(30, 41, 59, 0.95)',
  
  // Text colors
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  
  // Border colors
  border: '#334155',
  borderLight: '#475569',
  borderFocus: '#10b981',
  
  // Brand colors (maintain GrowthKit + FenixBlack essence)
  primary: '#10b981',
  primaryGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
  secondary: '#14b8a6',
  accent: '#06b6d4',
  
  // Status colors
  success: '#10b981',
  warning: '#f97316',
  error: '#ef4444',
  
  // FenixBlack accent colors (slightly adjusted for dark mode)
  magenta: '#d946ef',
  purple: '#a855f7',
  violet: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  
  // Shadows and effects
  shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
  shadowSm: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  
  // Interactive states
  hover: 'rgba(16, 185, 129, 0.1)',
  active: 'rgba(16, 185, 129, 0.2)',
  
  // Input specific colors
  inputBackground: 'rgba(51, 65, 85, 0.8)',
  inputBorder: '#475569',
  inputPlaceholder: '#94a3b8',
  inputFocus: 'rgba(16, 185, 129, 0.2)',
  
  // Modal specific colors
  overlay: 'rgba(0, 0, 0, 0.8)',
};

/**
 * Get the effective theme, resolving 'auto' to 'light' or 'dark'
 */
export function getEffectiveTheme(theme: GrowthKitTheme): 'light' | 'dark' {
  if (theme === 'auto') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default fallback
  }
  return theme;
}

/**
 * Get theme colors based on the theme type
 */
export function getThemeColors(theme: GrowthKitTheme): ThemeColors {
  const effectiveTheme = getEffectiveTheme(theme);
  return effectiveTheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Create CSS custom properties for theming
 * Useful for applying themes to components
 */
export function createThemeVariables(theme: GrowthKitTheme): Record<string, string> {
  const colors = getThemeColors(theme);
  
  return {
    '--gk-bg': colors.background,
    '--gk-bg-secondary': colors.backgroundSecondary,
    '--gk-bg-glass': colors.backgroundGlass,
    '--gk-text': colors.text,
    '--gk-text-secondary': colors.textSecondary,
    '--gk-text-muted': colors.textMuted,
    '--gk-border': colors.border,
    '--gk-border-light': colors.borderLight,
    '--gk-border-focus': colors.borderFocus,
    '--gk-primary': colors.primary,
    '--gk-primary-gradient': colors.primaryGradient,
    '--gk-secondary': colors.secondary,
    '--gk-accent': colors.accent,
    '--gk-success': colors.success,
    '--gk-warning': colors.warning,
    '--gk-error': colors.error,
    '--gk-magenta': colors.magenta,
    '--gk-purple': colors.purple,
    '--gk-violet': colors.violet,
    '--gk-orange': colors.orange,
    '--gk-pink': colors.pink,
    '--gk-shadow': colors.shadow,
    '--gk-shadow-sm': colors.shadowSm,
    '--gk-shadow-lg': colors.shadowLg,
    '--gk-hover': colors.hover,
    '--gk-active': colors.active,
    '--gk-input-bg': colors.inputBackground,
    '--gk-input-border': colors.inputBorder,
    '--gk-input-placeholder': colors.inputPlaceholder,
    '--gk-input-focus': colors.inputFocus,
    '--gk-overlay': colors.overlay,
  };
}

/**
 * Listen to system theme changes
 */
export function onSystemThemeChange(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}; // No-op for SSR
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  // Add listener (modern browsers)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  // Fallback for older browsers
  if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
  
  return () => {}; // No-op fallback
}

/**
 * Utility to create focus styles for inputs
 */
export function getFocusStyles(theme: ThemeColors) {
  return {
    borderColor: theme.borderFocus,
    boxShadow: `0 0 0 3px ${theme.inputFocus}`,
    backgroundColor: theme.background,
  };
}

/**
 * Utility to create hover styles for buttons
 */
export function getButtonHoverStyles(theme: ThemeColors) {
  return {
    transform: 'translateY(-2px)',
    boxShadow: `0 20px 40px -5px ${theme.primary}80, 0 8px 16px -4px ${theme.primary}40`,
  };
}
