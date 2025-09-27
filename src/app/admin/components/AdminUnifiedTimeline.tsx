'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineItem {
  id: string;
  type: 'activity' | 'operation';
  timestamp: string;
  timeGap: number | null;
  // Activity fields
  eventName?: string;
  properties?: any;
  context?: any;
  // Operation fields
  action?: string;
  amount?: number;
  metadata?: any;
}

interface AdminUnifiedTimelineProps {
  appId: string;
  fingerprintId: string;
}

export function AdminUnifiedTimeline({ appId, fingerprintId }: AdminUnifiedTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTimeline();
  }, [page, fingerprintId, appId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        fingerprintId,
        appId,
      });

      // Use admin proxy endpoint
      const response = await fetch(`/api/admin/proxy/analytics/timeline?${params}`);

      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (item: TimelineItem) => {
    if (item.type === 'activity') {
      // Activity icons
      const iconMap: Record<string, string> = {
        page_viewed: '👁️',
        button_clicked: '🖱️',
        form_submitted: '📝',
        feature_used: '⚡',
        error_occurred: '❌',
        user_signed_up: '🎉',
        session_started: '🚀',
      };
      return iconMap[item.eventName || ''] || '🔵';
    } else {
      // Operation icons
      return '💰';
    }
  };

  const getActionDescription = (action: string): string => {
    const descriptions: Record<string, string> = {
      'daily-grant': 'Daily Credits',
      'referral-bonus': 'Referral Bonus',
      'signup-bonus': 'Signup Bonus',
      'email-verification': 'Email Verification Bonus',
      'manual-adjustment': 'Manual Adjustment',
      'credit-spending': 'Credits Spent',
    };
    return descriptions[action] || action;
  };

  const formatTimeGap = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} gap`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} gap`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} gap`;
  };

  if (loading && timeline.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Timeline items */}
        <div className="space-y-2">
          {timeline.map((item, index) => (
            <div key={item.id}>
              {/* Time gap indicator */}
              {item.timeGap && item.timeGap > 5 * 60 * 1000 && index > 0 && (
                <div className="relative flex items-center py-2">
                  <div className="absolute left-5 w-0.5 h-full border-l-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                  <div className="ml-12 text-sm text-gray-500 dark:text-gray-400 italic">
                    {formatTimeGap(item.timeGap)}
                  </div>
                </div>
              )}

              {/* Timeline item */}
              <div className="relative flex items-start">
                {/* Icon */}
                <div className="absolute left-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-full 
                              flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                  <span className="text-lg">{getItemIcon(item)}</span>
                </div>

                {/* Content */}
                <div className="ml-12 flex-1 pb-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {item.type === 'activity' ? (
                          <>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {item.eventName}
                            </h4>
                            {item.properties && Object.keys(item.properties).length > 0 && (
                              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {Object.entries(item.properties).slice(0, 3).map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    {key}: {JSON.stringify(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.context && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                {item.context.browser} • {item.context.device} • {item.context.os}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {getActionDescription(item.action || '')}
                            </h4>
                            <div className="mt-1">
                              <span className={`text-lg font-semibold ${
                                (item.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(item.amount || 0) > 0 ? '+' : ''}{item.amount} credits
                              </span>
                            </div>
                            {item.metadata && (
                              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {item.metadata.reason || item.metadata.description || ''}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="ml-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {timeline.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No timeline data found for this user
        </div>
      )}
    </div>
  );
}
