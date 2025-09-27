/**
 * ECharts component exports
 * All chart components for the GrowthKit admin dashboard
 */

export { BaseChart } from '../BaseChart';
export type { EChartsOption } from '../BaseChart';
export { EChartsAreaChart } from '../EChartsAreaChart';
export { EChartsBarChart } from '../EChartsBarChart';
export { EChartsLineChart } from '../EChartsLineChart';
export { EChartsPieChart } from '../EChartsPieChart';
export { EChartsFunnelChart } from '../EChartsFunnelChart';
export { EChartsHeatmap } from '../EChartsHeatmap';
export { EChartsGauge } from '../EChartsGauge';
export { EChartsRadar } from '../EChartsRadar';
export { EChartsSankey } from '../EChartsSankey';

// Re-export theme utilities
export { chartColorSchemes, createGradient } from '@/lib/echarts-theme';
