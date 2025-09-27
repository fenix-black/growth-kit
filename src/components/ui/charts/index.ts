/**
 * ECharts component exports
 * All chart components for the GrowthKit admin dashboard
 */

export { BaseChart } from '../BaseChart';
export type { EChartsOption } from '../BaseChart';
export { EChartsAreaChart } from '../EChartsAreaChart';
export { EChartsBarChart } from '../EChartsBarChart';
export { EChartsPieChart } from '../EChartsPieChart';
export { EChartsFunnelChart } from '../EChartsFunnelChart';
export { EChartsHeatmap } from '../EChartsHeatmap';

// Re-export theme utilities
export { chartColorSchemes, createGradient } from '@/lib/echarts-theme';
