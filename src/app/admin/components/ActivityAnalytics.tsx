'use client';

import { useState, useEffect } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import StatsCard from '@/components/ui/StatsCard';
import { AdminActivityFeed } from './AdminActivityFeed';
import { EChartsHeatmap } from '@/components/ui/EChartsHeatmap';
import {
  BarChart3,
  Activity,
  Users,
  MousePointer,
  TrendingUp,
  Calendar,
  RefreshCw,
  DollarSign,
  FileText
} from 'lucide-react';
import { 
  EChartsAreaChart,
  EChartsBarChart,
  EChartsPieChart,
  chartColorSchemes
} from '@/components/ui/charts';

interface ActivityAnalyticsProps {
  appId: string;
  app?: any; // App object with publicKey
}

interface EventSummary {
  stats: {
    totalEvents: number;
    uniqueUsers: number;
    eventsToday: number;
    eventsPerUser: number;
  };
  eventFrequency: Array<{
    eventName: string;
    count: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
  }>;
  browserBreakdown: Array<{
    browser: string;
    count: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    dayOfWeek: number;
    count: number;
  }>;
}

interface UsdMetrics {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    uniqueUsers: number;
    avgTransactionValue: number;
    avgUserValue: number;
  };
  timeline?: Array<{
    period: string;
    revenue: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
  byUser?: Array<{
    fingerprintId: string;
    email?: string;
    name?: string;
    totalSpent: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
  byAction?: Array<{
    action: string;
    totalRevenue: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
}

interface GeneralMetrics {
  overview: {
    totalFingerprints: number;
    totalReferrals: number;
    totalLeads: number;
    verifiedEmails: number;
    totalWaitlist: number;
    invitedWaitlist: number;
    totalCreditsIssued: number;
    totalCreditsConsumed: number;
  };
  conversion: {
    referralConversionRate: number;
    emailVerificationRate: number;
  };
}

export default function ActivityAnalytics({ appId, app }: ActivityAnalyticsProps) {
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7');
  const [showFeed, setShowFeed] = useState(false);
  const [segmentsData, setSegmentsData] = useState<any>(null);
  const [usdMetrics, setUsdMetrics] = useState<UsdMetrics | null>(null);
  const [generalMetrics, setGeneralMetrics] = useState<GeneralMetrics | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchSegmentsData();
    fetchUsdMetrics();
    fetchGeneralMetrics();
  }, [appId, timeRange]);

  const fetchSummary = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/v1/admin/analytics/events/summary?days=${timeRange}&appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      } else {
        console.error('Failed to fetch event summary:', response.status);
      }
    } catch (error) {
      console.error('Error fetching event summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const fetchSegmentsData = async () => {
    try {
      const response = await fetch(`/api/v1/admin/analytics/segments?appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSegmentsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching segments data:', error);
    }
  };

  const fetchUsdMetrics = async () => {
    try {
      const timeRangeMap = { '7': '7d', '30': '30d', '90': '90d' };
      const mappedTimeRange = timeRangeMap[timeRange as keyof typeof timeRangeMap] || '7d';
      const groupBy = mappedTimeRange === '7d' ? 'day' : mappedTimeRange === '30d' ? 'week' : 'month';
      
      const response = await fetch(`/api/v1/admin/metrics/usd?appId=${appId}&groupBy=${groupBy}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsdMetrics(data.data);
      } else {
        console.error('Failed to fetch USD metrics:', response.status);
        setUsdMetrics(null);
      }
    } catch (error) {
      console.error('Error fetching USD metrics:', error);
      setUsdMetrics(null);
    }
  };

  const fetchGeneralMetrics = async () => {
    try {
      const response = await fetch(`/api/v1/admin/metrics?appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGeneralMetrics(data.data);
      } else {
        console.error('Failed to fetch general metrics:', response.status);
        setGeneralMetrics(null);
      }
    } catch (error) {
      console.error('Error fetching general metrics:', error);
      setGeneralMetrics(null);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Activity Analytics
        </h2>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={() => setShowFeed(!showFeed)}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 
                       transition-colors duration-200"
          >
            {showFeed ? 'Show Charts' : 'Show Activity Feed'}
          </button>
          <button
            onClick={fetchSummary}
            disabled={refreshing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 
                       dark:hover:text-gray-200 transition-colors"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Events"
            value={summary.stats.totalEvents.toLocaleString()}
            icon={<Activity size={24} />}
            color="primary"
          />
          <StatsCard
            title="Unique Users"
            value={summary.stats.uniqueUsers.toLocaleString()}
            icon={<Users size={24} />}
            color="secondary"
          />
          <StatsCard
            title="Events Today"
            value={summary.stats.eventsToday.toLocaleString()}
            icon={<Calendar size={24} />}
            color="primary"
          />
          <StatsCard
            title="Events per User"
            value={summary.stats.eventsPerUser.toFixed(1)}
            icon={<TrendingUp size={24} />}
            color="secondary"
          />
        </div>
      )}

      {/* Credit Metrics */}
      {generalMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Credits Issued"
            value={generalMetrics.overview.totalCreditsIssued.toLocaleString()}
            icon={<Activity size={24} />}
            color="primary"
          />
          <StatsCard
            title="Credits Consumed"
            value={generalMetrics.overview.totalCreditsConsumed.toLocaleString()}
            icon={<TrendingUp size={24} />}
            color="purple"
          />
          <StatsCard
            title="Referral Conversion"
            value={`${generalMetrics.conversion.referralConversionRate.toFixed(1)}%`}
            icon={<Users size={24} />}
            color="secondary"
          />
          <StatsCard
            title="Email Verification"
            value={`${generalMetrics.conversion.emailVerificationRate.toFixed(1)}%`}
            icon={<FileText size={24} />}
            color="violet"
          />
          <StatsCard
            title="Credits Balance"
            value={(generalMetrics.overview.totalCreditsIssued - generalMetrics.overview.totalCreditsConsumed).toLocaleString()}
            icon={<BarChart3 size={24} />}
            color="magenta"
          />
        </div>
      )}

      {/* USD Metrics Summary */}
      {usdMetrics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total USD Spent"
            value={formatCurrency(usdMetrics.summary.totalRevenue)}
            icon={<DollarSign size={24} />}
            color="orange"
          />
          <StatsCard
            title="Total Transactions"
            value={usdMetrics.summary.totalTransactions.toLocaleString()}
            icon={<Activity size={24} />}
            color="pink"
          />
          <StatsCard
            title="Avg Transaction Value"
            value={formatCurrency(usdMetrics.summary.avgTransactionValue)}
            icon={<TrendingUp size={24} />}
            color="violet"
          />
          <StatsCard
            title="Avg User Spend"
            value={formatCurrency(usdMetrics.summary.avgUserValue)}
            icon={<Users size={24} />}
            color="magenta"
          />
        </div>
      )}

      {/* Insights Block */}
      <ContentCard
        title="Insights"
        description="Key observations from your data"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Credit Efficiency</h4>
            <p className="text-2xl font-bold text-blue-700">
              {generalMetrics && generalMetrics.overview.totalCreditsConsumed > 0
                ? `${((generalMetrics.overview.totalCreditsConsumed / generalMetrics.overview.totalCreditsIssued) * 100).toFixed(1)}%`
                : '0%'}
            </p>
            <p className="text-xs text-blue-600 mt-1">Credits consumed vs issued</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">Cost per Credit</h4>
            <p className="text-2xl font-bold text-green-700">
              {usdMetrics && generalMetrics && generalMetrics.overview.totalCreditsConsumed > 0
                ? formatCurrency(usdMetrics.summary.totalRevenue / generalMetrics.overview.totalCreditsConsumed)
                : '$0.00'}
            </p>
            <p className="text-xs text-green-600 mt-1">Average USD value per credit</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Active Users</h4>
            <p className="text-2xl font-bold text-purple-700">
              {usdMetrics?.summary.uniqueUsers || 0}
            </p>
            <p className="text-xs text-purple-600 mt-1">Users with USD transactions</p>
          </div>
        </div>
      </ContentCard>

      {/* Main content - either feed or charts */}
      {showFeed ? (
        <ContentCard title="Activity Feed" noPadding>
          <div className="p-6">
            <AdminActivityFeed 
              appId={appId} 
              showUser={true}
            />
          </div>
        </ContentCard>
      ) : (
        <>
          {/* Event Frequency Chart */}
          {summary?.eventFrequency && summary.eventFrequency.length > 0 && (
            <ContentCard title="Most Common Events">
              <EChartsBarChart
                data={summary.eventFrequency}
                xKey="eventName"
                series={[
                  { dataKey: 'count', name: 'Events', color: '#a855f7' }
                ]}
                height={300}
                showLegend={false}
                colorScheme="analytics"
              />
            </ContentCard>
          )}

          {/* Device and Browser Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {summary?.deviceBreakdown && summary.deviceBreakdown.length > 0 && (
              <ContentCard title="Device Breakdown">
                <EChartsPieChart
                  data={summary.deviceBreakdown.map(item => ({
                    name: item.device,
                    value: item.count
                  }))}
                  height={300}
                  colorScheme="analytics"
                  donut={true}
                />
              </ContentCard>
            )}

            {summary?.browserBreakdown && summary.browserBreakdown.length > 0 && (
              <ContentCard title="Browser Breakdown">
                <EChartsPieChart
                  data={summary.browserBreakdown.map(item => ({
                    name: item.browser,
                    value: item.count
                  }))}
                  height={300}
                  colorScheme="analytics"
                  donut={true}
                />
              </ContentCard>
            )}
          </div>

          {/* Activity Heatmap */}
          {summary?.hourlyActivity && summary.hourlyActivity.length > 0 && (
            <ContentCard 
              title="Activity Heatmap" 
              description="User activity patterns by day and hour"
            >
              <EChartsHeatmap 
                data={summary.hourlyActivity.map(item => ({
                  hour: item.hour,
                  dayOfWeek: item.dayOfWeek,
                  count: item.count
                }))}
              />
            </ContentCard>
          )}


          {/* User Segments */}
          {segmentsData && (
            <ContentCard 
              title="User Segments" 
              description="Behavioral user segmentation"
              className="col-span-2"
            >
              <div className="space-y-4">
                {/* Segment Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {segmentsData.segments.map((segment: any) => (
                    <div 
                      key={segment.key}
                      className={`p-4 rounded-lg border-2 ${
                        segment.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                        segment.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                        segment.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                        segment.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <h4 className={`font-semibold ${
                        segment.color === 'purple' ? 'text-purple-900 dark:text-purple-100' :
                        segment.color === 'blue' ? 'text-blue-900 dark:text-blue-100' :
                        segment.color === 'green' ? 'text-green-900 dark:text-green-100' :
                        segment.color === 'orange' ? 'text-orange-900 dark:text-orange-100' :
                        'text-red-900 dark:text-red-100'
                      }`}>
                        {segment.name}
                      </h4>
                      <p className="text-2xl font-bold mt-2">{segment.count}</p>
                      <p className="text-sm opacity-75">{segment.percentage}%</p>
                    </div>
                  ))}
                </div>

                {/* Segment Details */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Segment Criteria</h4>
                  <div className="space-y-2">
                    {segmentsData.segments.map((segment: any) => (
                      <div key={segment.key} className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                          segment.color === 'purple' ? 'bg-purple-500' :
                          segment.color === 'blue' ? 'bg-blue-500' :
                          segment.color === 'green' ? 'bg-green-500' :
                          segment.color === 'orange' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{segment.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{segment.criteria}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ContentCard>
          )}

          {/* USD Financial Charts */}
          {usdMetrics?.timeline && (
            <ContentCard
              title="USD Spending Over Time"
              description="Financial metrics timeline"
              className="col-span-2"
            >
              <EChartsAreaChart
                data={usdMetrics.timeline}
                xKey="period"
                series={[
                  { dataKey: 'revenue', name: 'USD Spent', type: 'area', gradient: true },
                  { dataKey: 'transactionCount', name: 'Transactions', type: 'line' }
                ]}
                height={400}
                colorScheme="financial"
                formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value.toString()}
              />
            </ContentCard>
          )}

          {/* USD by Action Charts */}
          {usdMetrics?.byAction && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentCard
                title="USD Spending by Action"
                description="Which actions consume the most value"
                className="col-span-1"
              >
                <EChartsBarChart
                  data={usdMetrics.byAction}
                  xKey="action"
                  series={[
                    { dataKey: 'totalRevenue', name: 'Total Spent', color: '#d946ef' }
                  ]}
                  height={400}
                  horizontal={true}
                  colorScheme="financial"
                  formatter={(value) => formatCurrency(value)}
                  showLabel={true}
                />
              </ContentCard>

              <ContentCard
                title="Action Distribution"
                description="Percentage of spending by action type"
                className="col-span-1"
              >
                <EChartsPieChart
                  data={usdMetrics.byAction.map((item: any) => ({ 
                    name: item.action, 
                    value: item.totalRevenue 
                  }))}
                  height={400}
                  colorScheme="financial"
                  formatter={(value) => formatCurrency(value)}
                  donut={true}
                />
              </ContentCard>
            </div>
          )}

          {/* Top Spenders Table */}
          {usdMetrics?.byUser && (
            <ContentCard
              title="Top Spenders"
              description="Users with highest USD consumption"
              className="col-span-2"
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usdMetrics.byUser.slice(0, 10).map((user) => (
                      <tr key={user.fingerprintId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name || user.fingerprintId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(user.totalSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.transactionCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(user.avgTransactionValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ContentCard>
          )}
        </>
      )}
    </div>
  );
}
