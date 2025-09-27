'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  eventName: string;
  properties: any;
  context: any;
  timestamp: string;
  fingerprint?: {
    id: string;
    fingerprint: string;
    referralCode: string | null;
    leads: Array<{
      email: string | null;
      name: string | null;
    }>;
  };
}

interface ActivityFeedProps {
  appId: string;
  authToken: string;
  fingerprintId?: string;
  showUser?: boolean;
}

export function ActivityFeed({ appId, authToken, fingerprintId, showUser = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [eventFilter, setEventFilter] = useState('');
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchActivities();
  }, [page, eventFilter, fingerprintId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(eventFilter && { eventName: eventFilter }),
        ...(fingerprintId && { fingerprintId }),
      });

      const response = await fetch(`/api/v1/analytics/activities?${params}`, {
        headers: {
          'Authorization': authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const getEventIcon = (eventName: string) => {
    // Map common event names to icons
    const iconMap: Record<string, string> = {
      page_viewed: '👁️',
      button_clicked: '🖱️',
      form_submitted: '📝',
      feature_used: '⚡',
      error_occurred: '❌',
      user_signed_up: '🎉',
      file_uploaded: '📎',
    };
    return iconMap[eventName] || '🔵';
  };

  const getDeviceIcon = (device: string) => {
    const deviceMap: Record<string, string> = {
      desktop: '🖥️',
      mobile: '📱',
      tablet: '📲',
    };
    return deviceMap[device] || '📱';
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Filter by event name..."
          value={eventFilter}
          onChange={(e) => {
            setEventFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={fetchActivities}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                     transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {activities.map((activity) => {
          const isExpanded = expandedActivities.has(activity.id);
          const hasProperties = activity.properties && Object.keys(activity.properties).length > 0;

          return (
            <div
              key={activity.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 
                         bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getEventIcon(activity.eventName)}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.eventName}
                    </span>
                    {activity.context && (
                      <span className="text-sm text-gray-500">
                        {getDeviceIcon(activity.context.device)}
                      </span>
                    )}
                  </div>
                  
                  {showUser && activity.fingerprint && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {activity.fingerprint.leads[0]?.name || 
                       activity.fingerprint.leads[0]?.email || 
                       `User ${activity.fingerprint.id.slice(0, 8)}...`}
                    </div>
                  )}

                  {hasProperties && !isExpanded && (
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {Object.entries(activity.properties).slice(0, 2).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {JSON.stringify(value)}
                        </span>
                      ))}
                      {Object.keys(activity.properties).length > 2 && '...'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                  {(hasProperties || activity.context) && (
                    <button
                      onClick={() => toggleExpanded(activity.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                                 dark:hover:text-gray-200 transition-colors"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                  {hasProperties && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Properties
                      </h4>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(activity.properties, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {activity.context && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Context
                      </h4>
                      <div className="text-xs space-y-1">
                        <div>Browser: {activity.context.browser}</div>
                        <div>OS: {activity.context.os}</div>
                        <div>Device: {activity.context.device}</div>
                        <div>Screen: {activity.context.screenResolution}</div>
                        <div>Viewport: {activity.context.viewport}</div>
                        {activity.context.url && <div>URL: {activity.context.url}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {activities.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No activities found{eventFilter && ` for "${eventFilter}"`}
        </div>
      )}
    </div>
  );
}