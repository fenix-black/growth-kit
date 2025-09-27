/**
 * GrowthKit theme configuration
 * Defines brand colors and theme settings for the application
 */

export const growthKitTheme = {
  colors: {
    primary: {
      gradient: 'from-emerald-400 to-cyan-500',
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))',
    },
    secondary: {
      DEFAULT: 'hsl(var(--secondary))',
      foreground: 'hsl(var(--secondary-foreground))',
    },
    accent: {
      DEFAULT: 'hsl(var(--accent))',
      foreground: 'hsl(var(--accent-foreground))',
    },
    growthkit: {
      gradient: {
        start: 'hsl(var(--growthkit-gradient-start))',
        end: 'hsl(var(--growthkit-gradient-end))',
      },
    },
    fenix: {
      magenta: 'hsl(var(--fenix-magenta))',
      purple: 'hsl(var(--fenix-purple))',
      violet: 'hsl(var(--fenix-violet))',
      orange: 'hsl(var(--fenix-orange))',
      pink: 'hsl(var(--fenix-pink))',
    },
  },
  charts: {
    colors: ['#10b981', '#14b8a6', '#a855f7', '#f97316', '#06b6d4', '#d946ef', '#8b5cf6', '#ec4899'],
    growth: ['#10b981', '#14b8a6', '#06b6d4'],
    financial: ['#f97316', '#ec4899', '#d946ef'],
    analytics: ['#10b981', '#a855f7', '#f97316', '#06b6d4', '#d946ef'],
    gradients: [
      ['#34d399', '#10b981'],
      ['#14b8a6', '#06b6d4'],
      ['#d946ef', '#06b6d4'],
      ['#f97316', '#ec4899'],
    ],
  },
  radius: {
    DEFAULT: 'var(--radius)',
    sm: 'calc(var(--radius) - 2px)',
    md: 'var(--radius)',
    lg: 'calc(var(--radius) + 2px)',
  },
} as const;
