import React from 'react';
import { cn } from './utils';
import { formatDistanceToNow } from './dateUtils';

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon?: React.ReactNode;
  color?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
  showTimestamp?: boolean;
}

export default function ActivityFeed({ 
  activities, 
  maxItems = 10,
  className,
  showTimestamp = true
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        No recent activity
      </div>
    );
  }

  return (
    <div className={cn('flow-root', className)}>
      <ul className="-mb-8">
        {displayActivities.map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {idx !== displayActivities.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                      activity.color ? activity.color.replace('text-', 'bg-').replace('600', '100') : 'bg-gray-100'
                    )}
                  >
                    <span className={activity.color || 'text-gray-600'}>
                      {activity.icon || (
                        <div className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900">{activity.message}</p>
                  </div>
                  {showTimestamp && (
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {formatDistanceToNow(activity.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
