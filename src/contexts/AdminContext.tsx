'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface App {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  _count?: {
    apiKeys: number;
    fingerprints: number;
    referrals: number;
    leads: number;
    waitlist: number;
  };
}

interface AdminContextType {
  apps: App[];
  isLoading: boolean;
  error: any;
  mutate: () => void;
  handleAppSelect: (appId: string) => void;
  handleCreateApp: () => void;
  handleLogout: () => Promise<void>;
  isNavigating: boolean;
  currentNavigationTarget: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch');
  }
  const data = await response.json();
  return data.data.apps;
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentNavigationTarget, setCurrentNavigationTarget] = useState<string | null>(null);
  
  // Use SWR to fetch and cache apps data
  const { data: apps = [], error, isLoading, mutate } = useSWR<App[]>(
    '/api/admin/apps',
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
    }
  );

  const navigateWithFeedback = (path: string, label: string) => {
    setIsNavigating(true);
    setCurrentNavigationTarget(label);
    
    // Small delay to show the loading state, then navigate
    setTimeout(() => {
      router.push(path);
      // Reset after navigation starts
      setTimeout(() => {
        setIsNavigating(false);
        setCurrentNavigationTarget(null);
      }, 500);
    }, 100);
  };

  const handleAppSelect = (appId: string) => {
    const app = apps.find(a => a.id === appId);
    navigateWithFeedback(`/admin/app/${appId}`, app?.name || 'App Details');
  };

  const handleCreateApp = () => {
    navigateWithFeedback('/admin/apps/new', 'Create App');
  };

  const handleLogout = async () => {
    setIsNavigating(true);
    setCurrentNavigationTarget('Logging out...');
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const value: AdminContextType = {
    apps,
    isLoading,
    error,
    mutate,
    handleAppSelect,
    handleCreateApp,
    handleLogout,
    isNavigating,
    currentNavigationTarget,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

