'use client';

import { useState, useEffect } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import StatsCard from '@/components/ui/StatsCard';
import { AdminActivityFeed } from './AdminActivityFeed';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

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

  useEffect(() => {
    console.log('ActivityAnalytics mounted:', { appId, app });
    fetchSummary();
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
        console.log('Event summary data:', data);
        setSummary(data.data);
      } else {
        console.error('Failed to fetch event summary:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching event summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Prepare chart colors
  const chartColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
  
  // Transform hourly activity data for heatmap
  const prepareHeatmapData = () => {
    if (!summary?.hourlyActivity) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmapData: any[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourData: any = { hour: `${hour}:00` };
      days.forEach((day, dayIndex) => {
        const activity = summary.hourlyActivity.find(
          a => a.hour === hour && a.dayOfWeek === dayIndex
        );
        hourData[day] = activity?.count || 0;
      });
      heatmapData.push(hourData);
    }
    
    return heatmapData;
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
            color="blue"
          />
          <StatsCard
            title="Unique Users"
            value={summary.stats.uniqueUsers.toLocaleString()}
            icon={<Users size={24} />}
            color="purple"
          />
          <StatsCard
            title="Events Today"
            value={summary.stats.eventsToday.toLocaleString()}
            icon={<Calendar size={24} />}
            color="green"
          />
          <StatsCard
            title="Events per User"
            value={summary.stats.eventsPerUser.toFixed(1)}
            icon={<TrendingUp size={24} />}
            color="yellow"
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.eventFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ContentCard>
          )}

          {/* Device and Browser Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {summary?.deviceBreakdown && summary.deviceBreakdown.length > 0 && (
              <ContentCard title="Device Breakdown">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={summary.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={(entry) => `${entry.device}: ${entry.count}`}
                    >
                      {summary.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ContentCard>
            )}

            {summary?.browserBreakdown && summary.browserBreakdown.length > 0 && (
              <ContentCard title="Browser Breakdown">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={summary.browserBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={(entry) => `${entry.browser}: ${entry.count}`}
                    >
                      {summary.browserBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ContentCard>
            )}
          </div>

          {/* Activity Heatmap */}
          {summary?.hourlyActivity && summary.hourlyActivity.length > 0 && (
            <ContentCard 
              title="Activity Heatmap" 
              description="User activity patterns by day and hour"
            >
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={prepareHeatmapData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <Line
                        key={day}
                        type="monotone"
                        dataKey={day}
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>
          )}
        </>
      )}
    </div>
  );
}
