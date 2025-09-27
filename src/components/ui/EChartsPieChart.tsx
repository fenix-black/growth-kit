'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';
import { chartColorSchemes } from '@/lib/echarts-theme';

interface PieData {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieData[];
  height?: number | string;
  className?: string;
  loading?: boolean;
  showLegend?: boolean;
  colorScheme?: 'growth' | 'financial' | 'analytics';
  formatter?: (value: number) => string;
  title?: string;
  donut?: boolean;
}

export function EChartsPieChart({
  data,
  height = 350,
  className,
  loading = false,
  showLegend = true,
  colorScheme = 'analytics',
  formatter,
  title,
  donut = false,
}: PieChartProps) {
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
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const pieData = data.map((item, index) => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: colors[index % colors.length],
      },
    }));

    return {
      title: title ? {
        text: title,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
        },
      } : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percent = ((params.value / total) * 100).toFixed(1);
          const value = formatter ? formatter(params.value) : params.value.toLocaleString();
          return `<div style="padding: 8px;">
            <strong>${params.name}</strong><br/>
            Value: ${value}<br/>
            Percentage: ${percent}%
          </div>`;
        },
      },
      legend: showLegend ? {
        orient: 'vertical',
        right: 10,
        top: 'center',
        formatter: (name: string) => {
          const item = data.find(d => d.name === name);
          if (item) {
            const percent = ((item.value / total) * 100).toFixed(1);
            return `${name} (${percent}%)`;
          }
          return name;
        },
        textStyle: {
          fontSize: 12,
        },
      } : undefined,
      series: [
        {
          type: 'pie',
          radius: donut ? ['40%', '70%'] : '70%',
          center: showLegend ? ['40%', '50%'] : ['50%', '50%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          label: {
            show: true,
            position: donut ? 'outside' : 'inside',
            formatter: (params: any) => {
              const percentValue = (params.value / total) * 100;
              return percentValue >= 5 ? `${percentValue.toFixed(0)}%` : '';
            },
            color: donut ? undefined : '#fff',
            fontSize: 12,
          },
          labelLine: {
            show: donut,
            length: 10,
            length2: 20,
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: 'hsl(var(--background))',
            borderWidth: 2,
          },
          animationType: 'scale',
          animationEasing: 'cubicOut',
          animationDuration: 1000,
        },
      ],
    };
  }, [data, showLegend, colorScheme, formatter, title, donut]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
