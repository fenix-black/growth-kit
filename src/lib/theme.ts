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
  },
  charts: {
    colors: ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#0284c7'],
    gradients: [
      ['#34d399', '#10b981'],
      ['#14b8a6', '#06b6d4'],
      ['#06b6d4', '#0ea5e9'],
    ],
  },
  radius: {
    DEFAULT: 'var(--radius)',
    sm: 'calc(var(--radius) - 2px)',
    md: 'var(--radius)',
    lg: 'calc(var(--radius) + 2px)',
  },
} as const;
