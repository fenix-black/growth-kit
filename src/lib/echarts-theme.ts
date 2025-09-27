/**
 * GrowthKit ECharts theme configuration
 * Integrates with the existing GrowthKit + FenixBlack color system
 */

import { growthKitTheme } from './theme';

export const growthKitEChartsTheme = {
  color: growthKitTheme.charts.colors,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: 'hsl(var(--foreground))',
  },
  title: {
    textStyle: {
      color: 'hsl(var(--foreground))',
      fontSize: 16,
      fontWeight: 600,
    },
    subtextStyle: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 14,
    },
  },
  legend: {
    textStyle: {
      color: 'hsl(var(--foreground))',
    },
    pageTextStyle: {
      color: 'hsl(var(--muted-foreground))',
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: 'hsl(var(--border))',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12,
    },
    splitLine: {
      show: false,
    },
  },
  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12,
    },
    splitLine: {
      lineStyle: {
        color: 'hsl(var(--border))',
        type: 'dashed',
      },
    },
    splitArea: {
      show: false,
    },
  },
  tooltip: {
    backgroundColor: 'hsl(var(--popover))',
    borderColor: 'hsl(var(--border))',
    borderWidth: 1,
    textStyle: {
      color: 'hsl(var(--popover-foreground))',
    },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);',
  },
  series: {
    line: {
      smooth: true,
      showSymbol: false,
      lineStyle: {
        width: 2,
      },
      areaStyle: {
        opacity: 0.1,
      },
    },
    bar: {
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    pie: {
      itemStyle: {
        borderRadius: 4,
        borderColor: 'hsl(var(--background))',
        borderWidth: 2,
      },
      label: {
        color: 'hsl(var(--foreground))',
      },
      labelLine: {
        lineStyle: {
          color: 'hsl(var(--border))',
        },
      },
    },
    funnel: {
      itemStyle: {
        borderColor: 'hsl(var(--background))',
        borderWidth: 2,
      },
      label: {
        position: 'inside',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        label: {
          fontSize: 16,
        },
      },
    },
    heatmap: {
      itemStyle: {
        borderColor: 'hsl(var(--background))',
        borderWidth: 1,
      },
      label: {
        show: false,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  visualMap: {
    inRange: {
      color: ['#f3f4f6', '#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1', '#0c4a6e'],
    },
    textStyle: {
      color: 'hsl(var(--muted-foreground))',
    },
  },
};

// Chart-specific color configurations
export const chartColorSchemes = {
  growth: growthKitTheme.charts.growth,
  financial: growthKitTheme.charts.financial,
  analytics: growthKitTheme.charts.analytics,
  gradients: growthKitTheme.charts.gradients,
};

// Gradient color generator for ECharts
export const createGradient = (colorStart: string, colorEnd: string) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: colorStart },
    { offset: 1, color: colorEnd },
  ],
});
