import React from 'react';
import { cn } from './utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'primary' | 'secondary';
  loading?: boolean;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
  loading = false,
  className
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    yellow: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
  };

  const getTrendIcon = () => {
    if (!change) return <Minus className="h-4 w-4" />;
    return change > 0 ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            
            {(change !== undefined || changeLabel) && (
              <div className="mt-2 flex items-center text-sm">
                <span className={cn('flex items-center', getTrendColor())}>
                  {getTrendIcon()}
                  {change !== undefined && (
                    <span className="ml-1 font-medium">
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  )}
                </span>
                {changeLabel && (
                  <span className="ml-2 text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          
          {icon && (
            <div className={cn(
              'p-3 rounded-lg transition-colors',
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
