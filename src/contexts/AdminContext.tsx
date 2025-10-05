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

interface Organization {
  id: string;
  name: string;
}

interface AdminContextType {
  apps: App[];
  organizations: Organization[];
  currentOrgId: string | undefined;
  isLoading: boolean;
  error: any;
  mutate: () => void;
  handleAppSelect: (appId: string) => void;
  handleCreateApp: () => void;
  handleOrgChange: (orgId: string) => void;
  handleLogout: () => Promise<void>;
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

// Fetcher for user data with organizations
const userFetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch user data');
  }
  const data = await response.json();
  return data.data;
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentOrgId, setCurrentOrgId] = useState<string | undefined>(undefined);
  
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

  // Fetch user data with organizations
  const { data: userData, error: userError, isLoading: userLoading } = useSWR(
    '/api/admin/user',
    userFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  const organizations: Organization[] = userData?.organizations || [];
  
  // Set initial org if not set and organizations are available
  React.useEffect(() => {
    if (!currentOrgId && organizations.length > 0) {
      setCurrentOrgId(organizations[0].id);
    }
  }, [currentOrgId, organizations]);

  const handleAppSelect = (appId: string) => {
    router.push(`/admin/app/${appId}`);
  };

  const handleCreateApp = () => {
    router.push('/admin/apps/new');
  };

  const handleOrgChange = (orgId: string) => {
    setCurrentOrgId(orgId);
    // Optionally refresh apps data when org changes
    mutate();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const value: AdminContextType = {
    apps,
    organizations,
    currentOrgId,
    isLoading: isLoading || userLoading,
    error: error || userError,
    mutate,
    handleAppSelect,
    handleCreateApp,
    handleOrgChange,
    handleLogout,
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

