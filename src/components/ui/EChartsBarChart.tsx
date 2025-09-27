'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';
import { chartColorSchemes } from '@/lib/echarts-theme';

interface DataPoint {
  [key: string]: any;
}

interface Series {
  dataKey: string;
  name: string;
  color?: string;
  stack?: string;
}

interface BarChartProps {
  data: DataPoint[];
  xKey: string;
  series: Series[];
  height?: number | string;
  className?: string;
  loading?: boolean;
  showLegend?: boolean;
  colorScheme?: 'growth' | 'financial' | 'analytics';
  formatter?: (value: any) => string;
  horizontal?: boolean;
  showLabel?: boolean;
}

export function EChartsBarChart({
  data,
  xKey,
  series,
  height = 350,
  className,
  loading = false,
  showLegend = true,
  colorScheme = 'analytics',
  formatter,
  horizontal = false,
  showLabel = false,
}: BarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) {
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
    const categories = data.map(item => item[xKey]);

    const chartSeries = series.map((s, index) => {
      const seriesData = data.map(item => item[s.dataKey]);
      const color = s.color || colors[index % colors.length];
      
      return {
        name: s.name,
        type: 'bar',
        data: seriesData,
        stack: s.stack,
        itemStyle: {
          color: color,
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
          },
        },
        label: showLabel ? {
          show: true,
          position: horizontal ? 'right' : 'top',
          formatter: (params: any) => {
            return formatter ? formatter(params.value) : params.value.toLocaleString();
          },
          fontSize: 11,
        } : undefined,
        barMaxWidth: 60,
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          let tooltip = `<div style="padding: 8px;">
            <strong>${params[0].axisValue}</strong><br/>`;
          
          params.forEach((param: any) => {
            const value = formatter ? formatter(param.value) : param.value.toLocaleString();
            tooltip += `
              <span style="display: inline-block; width: 10px; height: 10px; 
                background: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
              ${param.seriesName}: <strong>${value}</strong><br/>`;
          });
          
          tooltip += '</div>';
          return tooltip;
        },
      },
      legend: showLegend && series.length > 1 ? {
        data: series.map(s => s.name),
        bottom: 0,
        textStyle: {
          fontSize: 12,
        },
      } : undefined,
      grid: {
        left: '3%',
        right: '4%',
        bottom: showLegend && series.length > 1 ? '15%' : '3%',
        top: '5%',
        containLabel: true,
      },
      xAxis: horizontal ? {
        type: 'value',
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: 'hsl(var(--border))',
          },
        },
        axisLabel: {
          formatter: formatter || ((value: number) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value.toString();
          }),
        },
      } : {
        type: 'category',
        data: categories,
        axisLine: {
          lineStyle: {
            color: 'hsl(var(--border))',
          },
        },
        axisLabel: {
          interval: 0,
          rotate: categories.length > 10 ? 45 : 0,
          formatter: (value: string) => {
            // Truncate long labels
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          },
        },
      },
      yAxis: horizontal ? {
        type: 'category',
        data: categories,
        axisLine: {
          lineStyle: {
            color: 'hsl(var(--border))',
          },
        },
        axisLabel: {
          formatter: (value: string) => {
            // Truncate long labels
            return value.length > 20 ? value.substring(0, 20) + '...' : value;
          },
        },
      } : {
        type: 'value',
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: 'hsl(var(--border))',
          },
        },
        axisLabel: {
          formatter: formatter || ((value: number) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value.toString();
          }),
        },
      },
      series: chartSeries,
      animationEasing: 'cubicOut',
      animationDuration: 1000,
      animationDelay: (idx: number) => idx * 50,
    };
  }, [data, xKey, series, showLegend, colorScheme, formatter, horizontal, showLabel]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
