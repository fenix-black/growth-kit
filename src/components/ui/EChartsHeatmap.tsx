'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';

interface HeatmapData {
  hour: number;
  dayOfWeek: number;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  maxValue?: number;
  height?: number | string;
  className?: string;
  loading?: boolean;
}

export function EChartsHeatmap({ 
  data, 
  maxValue,
  height = 300,
  className,
  loading = false,
}: ActivityHeatmapProps) {
  const option = useMemo<EChartsOption>(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => 
      i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`
    );

    // Calculate max value for normalization if not provided
    const max = maxValue || Math.max(...data.map(d => d.count), 1);

    // Transform data to ECharts format [hour, day, value]
    const heatmapData = data.map(item => [
      item.hour,
      item.dayOfWeek,
      item.count,
    ]);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const [hour, day, value] = params.data;
          const dayName = days[day];
          const hourLabel = hours[hour];
          return `<div style="padding: 8px;">
            <strong>${dayName} ${hourLabel}</strong><br/>
            Events: ${value}
          </div>`;
        },
      },
      grid: {
        left: 60,
        right: 20,
        top: 20,
        bottom: 80,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['hsla(var(--muted), 0.1)', 'transparent'],
          },
        },
        axisLabel: {
          interval: 1,
          formatter: (value: string, index: number) => {
            // Show every 2 hours
            return index % 2 === 0 ? value : '';
          },
        },
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['hsla(var(--muted), 0.1)', 'transparent'],
          },
        },
      },
      visualMap: {
        min: 0,
        max: max,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 20,
        inRange: {
          color: [
            'hsl(var(--muted))',      // No activity
            '#dbeafe',                // Light blue
            '#93c5fd',                // Medium blue
            '#60a5fa',                // Blue
            '#3b82f6',                // Stronger blue
            '#2563eb',                // Strong blue
            '#1d4ed8',                // Very strong blue
          ],
        },
        text: ['More', 'Less'],
        textStyle: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              borderColor: '#3b82f6',
              borderWidth: 2,
            },
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: 'hsl(var(--background))',
            borderWidth: 2,
          },
          animation: true,
          animationDuration: 1000,
          animationEasing: 'cubicOut',
        },
      ],
    };
  }, [data, maxValue]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
