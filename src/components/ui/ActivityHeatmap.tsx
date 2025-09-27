'use client';

import { useMemo } from 'react';

interface HeatmapData {
  hour: number;
  dayOfWeek: number;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  maxValue?: number;
}

export function ActivityHeatmap({ data, maxValue }: ActivityHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate max value for normalization if not provided
  const max = useMemo(() => {
    if (maxValue) return maxValue;
    return Math.max(...data.map(d => d.count), 1);
  }, [data, maxValue]);

  // Create a map for quick lookups
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      map.set(`${d.dayOfWeek}-${d.hour}`, d.count);
    });
    return map;
  }, [data]);

  // Get color intensity based on value
  const getColor = (value: number) => {
    const intensity = value / max;
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900/30';
    if (intensity < 0.4) return 'bg-blue-200 dark:bg-blue-800/40';
    if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-700/50';
    if (intensity < 0.8) return 'bg-blue-400 dark:bg-blue-600/60';
    return 'bg-blue-500 dark:bg-blue-500/70';
  };

  return (
    <div className="w-full">
      {/* Header with hour labels */}
      <div className="flex items-center mb-2">
        <div className="w-12"></div> {/* Spacer for day labels */}
        <div className="grid grid-cols-24 gap-1 flex-1">
          {hours.map(hour => (
            <div 
              key={hour} 
              className="text-xs text-gray-500 dark:text-gray-400 text-center"
            >
              {hour % 2 === 0 ? hour : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Grid with day labels */}
      {days.map((day, dayIndex) => (
        <div key={day} className="flex items-center mb-1">
          <div className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right pr-2">
            {day}
          </div>
          <div className="grid grid-cols-24 gap-1 flex-1">
            {hours.map(hour => {
              const value = dataMap.get(`${dayIndex}-${hour}`) || 0;
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={`aspect-square rounded-sm ${getColor(value)} 
                             hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 
                             cursor-pointer transition-all group relative`}
                  title={`${day} ${hour}:00 - ${value} events`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs 
                                rounded opacity-0 group-hover:opacity-100 transition-opacity
                                pointer-events-none whitespace-nowrap z-10">
                    {value} events
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4">
        <span className="text-xs text-gray-600 dark:text-gray-400">Less</span>
        <div className="flex space-x-1">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-sm ${
                i === 0 ? 'bg-gray-100 dark:bg-gray-800' :
                i === 1 ? 'bg-blue-100 dark:bg-blue-900/30' :
                i === 2 ? 'bg-blue-200 dark:bg-blue-800/40' :
                i === 3 ? 'bg-blue-300 dark:bg-blue-700/50' :
                i === 4 ? 'bg-blue-400 dark:bg-blue-600/60' :
                'bg-blue-500 dark:bg-blue-500/70'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">More</span>
      </div>
    </div>
  );
}
