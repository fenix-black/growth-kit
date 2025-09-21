'use client';

import React from 'react';
import { cn } from './utils';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  apps: Array<{
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
  }>;
  currentAppId?: string;
  onAppSelect?: (appId: string) => void;
  onCreateApp?: () => void;
  onLogout?: () => void;
  className?: string;
}

export default function DashboardLayout({
  children,
  apps,
  currentAppId,
  onAppSelect,
  onCreateApp,
  onLogout,
  className
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        apps={apps}
        currentAppId={currentAppId}
        onAppSelect={onAppSelect}
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
