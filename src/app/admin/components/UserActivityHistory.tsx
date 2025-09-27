'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  id: string;
  eventName: string;
  properties: any;
  context: any;
  timestamp: string;
}

interface UserActivityHistoryProps {
  appId: string;
  fingerprintId: string;
}

export function UserActivityHistory({ appId, fingerprintId }: UserActivityHistoryProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [eventFilter, setEventFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('7'); // days

  useEffect(() => {
    fetchActivities();
  }, [page, eventFilter, timeRange, fingerprintId, appId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        days: timeRange,
        fingerprintId,
        ...(eventFilter && { eventName: eventFilter }),
      });

      const response = await fetch(`/api/v1/admin/analytics/activities?appId=${appId}&${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data.activities);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportActivities = () => {
    const csv = [
      ['Event Name', 'Timestamp', 'Properties', 'Device', 'Browser', 'OS'].join(','),
      ...activities.map(a => [
        a.eventName,
        new Date(a.timestamp).toISOString(),
        JSON.stringify(a.properties || {}),
        a.context?.device || '',
        a.context?.browser || '',
        a.context?.os || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-activities-${fingerprintId}-${new Date().toISOString()}.csv`;
    link.click();
  };

  const filteredActivities = activities.filter(activity => {
    if (!searchTerm) return true;
    return (
      activity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(activity.properties).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get unique event names for filter dropdown
  const eventNames = [...new Set(activities.map(a => a.eventName))];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => {
              setEventFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Events</option>
            {eventNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {/* Time Range */}
          <select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Export */}
        <button
          onClick={exportActivities}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No activities found
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                       rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.eventName}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {/* Properties */}
                  {activity.properties && Object.keys(activity.properties).length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Properties: </span>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {JSON.stringify(activity.properties)}
                      </span>
                    </div>
                  )}
                  
                  {/* Context */}
                  {activity.context && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                      {activity.context.device && <span>📱 {activity.context.device}</span>}
                      {activity.context.browser && <span>🌐 {activity.context.browser}</span>}
                      {activity.context.os && <span>💻 {activity.context.os}</span>}
                      {activity.context.ip && <span>🌍 {activity.context.ip}</span>}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
