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
  smooth?: boolean;
  showSymbol?: boolean;
}

interface LineChartProps {
  data: DataPoint[];
  xKey: string;
  series: Series[];
  height?: number | string;
  className?: string;
  loading?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  colorScheme?: 'growth' | 'financial' | 'analytics';
  formatter?: (value: any) => string;
  xAxisFormatter?: (value: any) => string;
}

export function EChartsLineChart({
  data,
  xKey,
  series,
  height = 350,
  className,
  loading = false,
  showLegend = true,
  showGrid = true,
  colorScheme = 'analytics',
  formatter,
  xAxisFormatter,
}: LineChartProps) {
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
    const xAxisData = data.map(item => item[xKey]);

    const chartSeries = series.map((s, index) => {
      const seriesData = data.map(item => item[s.dataKey]);
      const color = s.color || colors[index % colors.length];
      
      return {
        name: s.name,
        type: 'line',
        data: seriesData,
        smooth: s.smooth !== false,
        showSymbol: s.showSymbol || false,
        lineStyle: {
          width: 2,
          color: color,
        },
        itemStyle: {
          color: color,
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#fff',
          },
        },
        symbolSize: 6,
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: 'hsl(var(--popover))',
          },
        },
        formatter: (params: any) => {
          let tooltip = `<div style="padding: 8px;">
            <strong>${xAxisFormatter ? xAxisFormatter(params[0].axisValue) : params[0].axisValue}</strong><br/>`;
          
          params.forEach((param: any) => {
            const value = formatter ? formatter(param.value) : param.value.toLocaleString();
            tooltip += `
              <span style="display: inline-block; width: 10px; height: 10px; 
                background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
              ${param.seriesName}: <strong>${value}</strong><br/>`;
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
      grid: {
        left: '3%',
        right: '4%',
        bottom: showLegend ? '15%' : '3%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLine: {
          lineStyle: {
            color: 'hsl(var(--border))',
          },
        },
        axisLabel: {
          formatter: xAxisFormatter || ((value: string) => {
            // Format dates if they look like dates
            if (value.includes('-') || value.includes('/')) {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }
            return value;
          }),
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        splitLine: {
          show: showGrid,
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
    };
  }, [data, xKey, series, showLegend, showGrid, colorScheme, formatter, xAxisFormatter]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
