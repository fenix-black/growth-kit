'use client';

import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import DashboardLayout from '@/components/ui/DashboardLayout';

/**
 * Inner wrapper that conditionally applies DashboardLayout
 * Pages like login/signup don't need the dashboard layout
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { apps, isLoading, handleAppSelect, handleCreateApp, handleLogout } = useAdmin();
  
  // Don't apply dashboard layout for auth pages
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // Show loading state while fetching apps
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <DashboardLayout
      apps={apps}
      onAppSelect={handleAppSelect}
      onCreateApp={handleCreateApp}
      onLogout={handleLogout}
    >
      {children}
    </DashboardLayout>
  );
}

/**
 * Main layout wrapper that provides AdminContext to all admin pages
 */
export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <LayoutContent>{children}</LayoutContent>
    </AdminProvider>
  );
}

