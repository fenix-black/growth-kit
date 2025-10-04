'use client';

import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import DashboardLayout from '@/components/ui/DashboardLayout';

/**
 * Inner wrapper that applies DashboardLayout for authenticated pages
 */
function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { apps, isLoading, handleAppSelect, handleCreateApp, handleLogout } = useAdmin();
  
  // Extract current app ID from URL when on app detail pages
  const currentAppId = pathname?.match(/^\/admin\/app\/([^\/]+)/)?.[1];
  
  // Show loading state while fetching apps
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <DashboardLayout
      apps={apps}
      currentAppId={currentAppId}
      onAppSelect={handleAppSelect}
      onCreateApp={handleCreateApp}
      onLogout={handleLogout}
    >
      {children}
    </DashboardLayout>
  );
}

/**
 * Main layout wrapper that conditionally applies AdminContext and DashboardLayout
 * Auth pages (login/signup) are rendered without the provider to avoid unnecessary API calls
 */
export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't apply provider or dashboard layout for auth pages
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup');
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // Wrap authenticated pages with provider and dashboard layout
  return (
    <AdminProvider>
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </AdminProvider>
  );
}

