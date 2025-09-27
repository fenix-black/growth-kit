'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  FunnelChart,
  HeatmapChart,
  ScatterChart 
} from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  MarkLineComponent,
  MarkPointComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { growthKitEChartsTheme } from '@/lib/echarts-theme';
import { cn } from './utils';

// Register ECharts components
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  HeatmapChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  MarkLineComponent,
  MarkPointComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

interface BaseChartProps {
  option: echarts.EChartsCoreOption;
  height?: number | string;
  className?: string;
  loading?: boolean;
  onChartReady?: (chart: echarts.ECharts) => void;
  theme?: 'light' | 'dark' | 'auto';
}

export function BaseChart({
  option,
  height = 400,
  className,
  loading = false,
  onChartReady,
  theme = 'auto',
}: BaseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart with theme
    const chart = echarts.init(chartRef.current, growthKitEChartsTheme, {
      renderer: 'canvas',
    });

    // Set initial options
    chart.setOption(option);

    // Handle resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    // Notify parent component
    if (onChartReady) {
      onChartReady(chart);
    }

    setChartInstance(chart);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []); // Only run on mount

  // Update chart options when they change
  useEffect(() => {
    if (chartInstance && option) {
      chartInstance.setOption(option, true);
    }
  }, [chartInstance, option]);

  // Show/hide loading
  useEffect(() => {
    if (!chartInstance) return;

    if (loading) {
      chartInstance.showLoading('default', {
        text: 'Loading...',
        color: '#10b981',
        textColor: 'hsl(var(--foreground))',
        maskColor: 'hsla(var(--background), 0.8)',
        zlevel: 0,
      });
    } else {
      chartInstance.hideLoading();
    }
  }, [chartInstance, loading]);

  // Handle theme changes
  useEffect(() => {
    if (!chartInstance || !chartRef.current) return;

    const applyTheme = () => {
      const isDark = theme === 'dark' || 
        (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      // Re-initialize chart with updated theme if needed
      chartInstance.dispose();
      const newChart = echarts.init(chartRef.current!, growthKitEChartsTheme, {
        renderer: 'canvas',
      });
      newChart.setOption(option);
      setChartInstance(newChart);
    };

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme, option]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full', className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}

// Export ECharts types for convenience
export type { EChartsCoreOption as EChartsOption } from 'echarts/core';
export { echarts };
