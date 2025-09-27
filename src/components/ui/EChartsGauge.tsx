'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';
import { chartColorSchemes } from '@/lib/echarts-theme';

interface GaugeChartProps {
  value: number;
  max?: number;
  title?: string;
  subtitle?: string;
  height?: number | string;
  className?: string;
  loading?: boolean;
  formatter?: (value: number) => string;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  showProgress?: boolean;
}

export function EChartsGauge({
  value,
  max = 100,
  title,
  subtitle,
  height = 300,
  className,
  loading = false,
  formatter,
  thresholds = { low: 30, medium: 70, high: 90 },
  showProgress = true,
}: GaugeChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const percentage = (value / max) * 100;
    
    // Determine color based on thresholds
    let color: string = chartColorSchemes.growth[0]; // Green for low/good
    if (percentage > thresholds.high) {
      color = '#ef4444'; // Red for high/critical
    } else if (percentage > thresholds.medium) {
      color = chartColorSchemes.financial[0]; // Orange for medium/warning
    }

    return {
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          center: ['50%', '60%'],
          radius: '90%',
          min: 0,
          max: max,
          splitNumber: 5,
          itemStyle: {
            color: color,
            shadowColor: 'rgba(0,0,0,0.1)',
            shadowBlur: 10,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
          progress: showProgress ? {
            show: true,
            roundCap: true,
            width: 18,
          } : undefined,
          pointer: {
            icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
            length: '75%',
            width: 16,
            offsetCenter: [0, '5%'],
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 18,
              color: [
                [thresholds.low / max, chartColorSchemes.growth[0]],
                [thresholds.medium / max, chartColorSchemes.analytics[1]],
                [thresholds.high / max, chartColorSchemes.financial[0]],
                [1, '#ef4444'],
              ],
            },
          },
          axisTick: {
            splitNumber: 2,
            lineStyle: {
              width: 2,
              color: '#999',
            },
          },
          splitLine: {
            length: 12,
            lineStyle: {
              width: 3,
              color: '#999',
            },
          },
          axisLabel: {
            distance: 30,
            color: 'hsl(var(--muted-foreground))',
            fontSize: 14,
            formatter: formatter || ((val: number) => {
              if (val === 0) return '0';
              if (val === max) return max.toString();
              return Math.round(val).toString();
            }),
          },
          title: title ? {
            show: true,
            offsetCenter: [0, '30%'],
            color: 'hsl(var(--foreground))',
            fontSize: 18,
            fontWeight: 600,
          } : undefined,
          detail: {
            width: 60,
            height: 30,
            fontSize: 24,
            fontWeight: 700,
            color: color,
            borderColor: color,
            borderRadius: 8,
            borderWidth: 1,
            formatter: formatter || ((val: number) => `${Math.round((val / max) * 100)}%`),
            offsetCenter: [0, '70%'],
          },
          data: [
            {
              value: value,
              name: title || '',
            },
          ],
        },
      ],
      graphic: subtitle ? [
        {
          type: 'text',
          left: 'center',
          bottom: 20,
          style: {
            text: subtitle,
            fontSize: 12,
            fill: 'hsl(var(--muted-foreground))',
          },
        },
      ] : undefined,
    };
  }, [value, max, title, subtitle, formatter, thresholds, showProgress]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
