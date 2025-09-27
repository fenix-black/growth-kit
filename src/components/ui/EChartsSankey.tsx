'use client';

import React, { useMemo } from 'react';
import { BaseChart, type EChartsOption } from './BaseChart';
import { chartColorSchemes } from '@/lib/echarts-theme';

interface SankeyNode {
  name: string;
  value?: number;
  itemStyle?: {
    color?: string;
  };
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyChartProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number | string;
  className?: string;
  loading?: boolean;
  orient?: 'horizontal' | 'vertical';
  colorScheme?: 'growth' | 'financial' | 'analytics';
  nodeWidth?: number;
  nodeGap?: number;
  nodeAlign?: 'left' | 'right' | 'justify';
  layoutIterations?: number;
}

export function EChartsSankey({
  nodes,
  links,
  height = 500,
  className,
  loading = false,
  orient = 'horizontal',
  colorScheme = 'analytics',
  nodeWidth = 20,
  nodeGap = 10,
  nodeAlign = 'justify',
  layoutIterations = 32,
}: SankeyChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!nodes || nodes.length === 0 || !links || links.length === 0) {
      return {
        title: {
          text: 'No flow data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: 'hsl(var(--muted-foreground))',
          },
        },
      };
    }

    const colors = chartColorSchemes[colorScheme];
    
    // Assign colors to nodes if not specified
    const processedNodes = nodes.map((node, index) => ({
      ...node,
      itemStyle: node.itemStyle || {
        color: colors[index % colors.length],
      },
    }));

    return {
      title: {
        text: '',
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const value = params.value || 0;
            return `<div style="padding: 8px;">
              <strong>${params.name}</strong><br/>
              Value: ${value.toLocaleString()}
            </div>`;
          } else if (params.dataType === 'edge') {
            return `<div style="padding: 8px;">
              <strong>${params.data.source} → ${params.data.target}</strong><br/>
              Flow: ${params.value.toLocaleString()}
            </div>`;
          }
          return '';
        },
      },
      series: [
        {
          type: 'sankey',
          data: processedNodes,
          links: links,
          orient: orient,
          nodeWidth: nodeWidth,
          nodeGap: nodeGap,
          nodeAlign: nodeAlign,
          layoutIterations: layoutIterations,
          emphasis: {
            focus: 'adjacency',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
            lineStyle: {
              opacity: 0.6,
            },
          },
          lineStyle: {
            color: 'gradient',
            opacity: 0.3,
            curveness: 0.5,
          },
          label: {
            show: true,
            position: orient === 'horizontal' ? 'right' : 'top',
            formatter: '{b}',
            color: 'hsl(var(--foreground))',
            fontSize: 12,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: 'hsl(var(--border))',
          },
          animationType: 'wave',
          animationEasing: 'cubicOut',
          animationDuration: 1500,
        },
      ],
    };
  }, [nodes, links, orient, colorScheme, nodeWidth, nodeGap, nodeAlign, layoutIterations]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
