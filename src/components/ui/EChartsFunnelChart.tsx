'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';
import { chartColorSchemes } from '@/lib/echarts-theme';

interface FunnelStep {
  step: string;
  users: number;
  conversionRate: number;
}

interface FunnelChartProps {
  data: FunnelStep[];
  overallConversion: number;
  height?: number | string;
  className?: string;
  loading?: boolean;
}

export function EChartsFunnelChart({ 
  data, 
  overallConversion, 
  height = 400,
  className,
  loading = false,
}: FunnelChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (data.length === 0) {
      return {
        title: {
          text: 'No funnel data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: 'hsl(var(--muted-foreground))',
          },
        },
      };
    }

    // Prepare data for ECharts funnel
    const funnelData = data.map((step, index) => ({
      value: step.users,
      name: `${step.step}\n${step.users.toLocaleString()} users\n${step.conversionRate}%`,
      itemStyle: {
        color: chartColorSchemes.analytics[index % chartColorSchemes.analytics.length],
      },
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => {
          const stepData = data[params.dataIndex];
          return `{title|${stepData.step}}\n{users|${stepData.users.toLocaleString()} users}\n{rate|${stepData.conversionRate}%}`;
        },
        rich: {
          title: {
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
            lineHeight: 20,
          },
          users: {
            color: '#fff',
            fontSize: 12,
            lineHeight: 18,
            opacity: 0.9,
          },
          rate: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            lineHeight: 24,
          },
        },
      },
      emphasis: {
        label: {
          fontSize: 16,
        },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
        },
      },
    }));

    return {
      title: {
        text: `Overall Conversion: ${overallConversion}%`,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: chartColorSchemes.analytics[0],
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const step = data[params.dataIndex];
          const dropOff = params.dataIndex < data.length - 1 
            ? (100 - data[params.dataIndex + 1].conversionRate).toFixed(1)
            : null;
          
          let tooltip = `<div style="padding: 8px;">
            <strong>${step.step}</strong><br/>
            Users: ${step.users.toLocaleString()}<br/>
            Conversion: ${step.conversionRate}%`;
          
          if (dropOff) {
            tooltip += `<br/><span style="color: #ef4444;">Drop-off: -${dropOff}%</span>`;
          }
          
          tooltip += '</div>';
          return tooltip;
        },
      },
      series: [
        {
          type: 'funnel',
          left: '10%',
          right: '10%',
          top: 80,
          bottom: 60,
          width: '80%',
          min: 0,
          max: Math.max(...data.map(d => d.users)),
          minSize: '30%',
          maxSize: '100%',
          sort: 'none',
          gap: 2,
          data: funnelData,
          animationType: 'scale',
          animationDuration: 1000,
        },
      ],
      // Add drop-off indicators
      graphic: data.slice(0, -1).map((_, index) => {
        const dropOff = (100 - data[index + 1].conversionRate).toFixed(1);
        return {
          type: 'text',
          right: '5%',
          top: `${30 + (index + 0.5) * ((height as number - 140) / data.length)}px`,
          style: {
            text: `-${dropOff}%`,
            font: 'bold 14px Inter',
            fill: '#ef4444',
          },
          invisible: false,
        };
      }),
    };
  }, [data, overallConversion, height]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
