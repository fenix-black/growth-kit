'use client';

import { useState, useEffect } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import StatsCard from '@/components/ui/StatsCard';
import { AdminActivityFeed } from './AdminActivityFeed';
import { EChartsHeatmap } from '@/components/ui/EChartsHeatmap';
import { EChartsFunnelChart } from '@/components/ui/EChartsFunnelChart';
import {
  BarChart3,
  Activity,
  Users,
  MousePointer,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { 
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

export default function ActivityAnalytics({ appId, app }: ActivityAnalyticsProps) {
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7');
  const [showFeed, setShowFeed] = useState(false);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [segmentsData, setSegmentsData] = useState<any>(null);
  const [funnelSteps, setFunnelSteps] = useState<string[]>(['page_viewed', 'button_clicked', 'form_submitted']);

  useEffect(() => {
    fetchSummary();
    fetchFunnelData();
    fetchSegmentsData();
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

  const fetchFunnelData = async () => {
    try {
      const params = new URLSearchParams({
        appId,
        steps: funnelSteps.join(','),
        days: timeRange,
      });

      const response = await fetch(`/api/v1/admin/analytics/funnel?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.data);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
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

          {/* Funnel Analysis */}
          {funnelData && (
            <ContentCard 
              title="Conversion Funnel" 
              description="Track user progression through key events"
              className="col-span-2"
            >
              <EChartsFunnelChart 
                data={funnelData.funnel}
                overallConversion={funnelData.overallConversion}
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
        </>
      )}
    </div>
  );
}
