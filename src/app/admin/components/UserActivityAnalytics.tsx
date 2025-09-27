'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

interface UserActivityAnalyticsProps {
  appId: string;
  fingerprintId: string;
}

interface EventFrequency {
  eventName: string;
  count: number;
  [key: string]: any;
}

interface DailyActivity {
  date: string;
  count: number;
  [key: string]: any;
}

interface HourlyPattern {
  hour: number;
  avgCount: number;
  [key: string]: any;
}

interface ActivityStats {
  totalEvents: number;
  uniqueEventTypes: number;
  avgEventsPerDay: number;
  mostActiveHour: number;
  mostActiveDay: string;
}

export function UserActivityAnalytics({ appId, fingerprintId }: UserActivityAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [eventFrequency, setEventFrequency] = useState<EventFrequency[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [hourlyPattern, setHourlyPattern] = useState<HourlyPattern[]>([]);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [appId, fingerprintId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        appId,
        fingerprintId,
        days: timeRange,
      });

      const response = await fetch(`/api/v1/admin/analytics/user/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setEventFrequency(data.data.eventFrequency);
        setDailyActivity(data.data.dailyActivity);
        setHourlyPattern(data.data.hourlyPattern);
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No activity data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalEvents}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.uniqueEventTypes}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Event Types</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.avgEventsPerDay.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg/Day</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.mostActiveHour}:00
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Peak Hour</p>
        </div>
        <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
          <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
            {stats.mostActiveDay}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Most Active</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Frequency */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-4">Event Frequency</h4>
          {eventFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventFrequency.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="eventName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No event data
            </div>
          )}
        </div>

        {/* Daily Activity Trend */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-4">Daily Activity Trend</h4>
          {dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No activity data
            </div>
          )}
        </div>

        {/* Event Type Distribution */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-4">Event Type Distribution</h4>
          {eventFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={eventFrequency.slice(0, 8).map(item => ({ 
                    ...item,
                    name: item.eventName 
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                >
                  {eventFrequency.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No event data
            </div>
          )}
        </div>

        {/* Hourly Activity Pattern */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-4">Average Hourly Activity</h4>
          {hourlyPattern.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}:00`}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                />
                <Bar dataKey="avgCount" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No activity data
            </div>
          )}
        </div>
      </div>

      {/* Event Patterns */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold mb-4">Common Event Sequences</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="italic">Event sequence analysis coming soon...</p>
        </div>
      </div>
    </div>
  );
}
