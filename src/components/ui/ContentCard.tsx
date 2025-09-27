import React from 'react';
import { cn } from './utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ContentCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  loading?: boolean;
}

export default function ContentCard({ 
  title, 
  description, 
  actions, 
  children, 
  className,
  noPadding = false,
  loading = false
}: ContentCardProps) {
  return (
    <Card className={className}>
      {(title || description || actions) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(
        noPadding && 'p-0',
        loading && 'opacity-50',
        !title && !description && !actions && 'pt-6' // Add top padding when no header
      )}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
