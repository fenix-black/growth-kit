'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';
import { chartColorSchemes } from '@/lib/echarts-theme';

interface RadarIndicator {
  name: string;
  max: number;
}

interface RadarSeries {
  name: string;
  value: number[];
  color?: string;
}

interface RadarChartProps {
  indicators: RadarIndicator[];
  series: RadarSeries[];
  height?: number | string;
  className?: string;
  loading?: boolean;
  showLegend?: boolean;
  shape?: 'polygon' | 'circle';
  colorScheme?: 'growth' | 'financial' | 'analytics';
}

export function EChartsRadar({
  indicators,
  series,
  height = 400,
  className,
  loading = false,
  showLegend = true,
  shape = 'polygon',
  colorScheme = 'analytics',
}: RadarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!indicators || indicators.length === 0 || !series || series.length === 0) {
      return {
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: 'hsl(var(--muted-foreground))',
          },
        },
      };
    }

    const colors = chartColorSchemes[colorScheme];

    const radarData = series.map((s, index) => ({
      name: s.name,
      value: s.value,
      itemStyle: {
        color: s.color || colors[index % colors.length],
      },
      lineStyle: {
        color: s.color || colors[index % colors.length],
        width: 2,
      },
      areaStyle: {
        color: s.color || colors[index % colors.length],
        opacity: 0.2,
      },
      emphasis: {
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          opacity: 0.4,
        },
      },
    }));

    return {
      title: {
        text: '',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          let tooltip = `<div style="padding: 8px;">
            <strong>${data.name}</strong><br/>`;
          
          indicators.forEach((indicator, index) => {
            const value = data.value[index];
            const percentage = ((value / indicator.max) * 100).toFixed(1);
            tooltip += `${indicator.name}: <strong>${value}</strong> (${percentage}%)<br/>`;
          });
          
          tooltip += '</div>';
          return tooltip;
        },
      },
      legend: showLegend ? {
        data: series.map(s => s.name),
        bottom: 0,
        textStyle: {
          fontSize: 12,
        },
      } : undefined,
      radar: {
        shape: shape,
        indicator: indicators,
        center: ['50%', '50%'],
        radius: showLegend ? '65%' : '75%',
        startAngle: 90,
        splitNumber: 4,
        axisName: {
          color: 'hsl(var(--foreground))',
          fontSize: 12,
          fontWeight: 500,
        },
        splitLine: {
          lineStyle: {
            color: 'hsl(var(--border))',
            type: 'dashed',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['hsla(var(--muted), 0.1)', 'transparent'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'hsl(var(--border))',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: radarData,
          symbol: 'circle',
          symbolSize: 6,
          animationEasing: 'cubicOut',
          animationDuration: 1000,
        },
      ],
    };
  }, [indicators, series, showLegend, shape, colorScheme]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
