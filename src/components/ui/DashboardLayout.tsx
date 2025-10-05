'use client';

import React from 'react';
import { cn } from './utils';
import Sidebar from './Sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface DashboardLayoutProps {
  children: React.ReactNode;
  apps: Array<{
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
  }>;
  organizations: Array<{
    id: string;
    name: string;
  }>;
  currentAppId?: string;
  currentOrgId?: string;
  onAppSelect?: (appId: string) => void;
  onOrgChange?: (orgId: string) => void;
  onCreateApp?: () => void;
  onLogout?: () => void;
  className?: string;
}

export default function DashboardLayout({
  children,
  apps,
  organizations,
  currentAppId,
  currentOrgId,
  onAppSelect,
  onOrgChange,
  onCreateApp,
  onLogout,
  className
}: DashboardLayoutProps) {
  useKeyboardShortcuts();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        apps={apps}
        organizations={organizations}
        currentAppId={currentAppId}
        currentOrgId={currentOrgId}
        onAppSelect={onAppSelect}
        onOrgChange={onOrgChange}
        onCreateApp={onCreateApp}
        onLogout={onLogout}
      />
      
      <main className={cn(
        'lg:pl-64 transition-all duration-300',
        className
      )}>
        <div className="px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
