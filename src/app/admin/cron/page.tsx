'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Lazy load the cron monitor component
const CronJobMonitor = lazy(() => import('../components/CronJobMonitorEnhanced'));

interface App {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
}

export default function CronDashboardPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/v1/admin/app', {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setApps(data.data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppSelect = (appId: string) => {
    router.push(`/admin/app/${appId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      apps={apps}
      onAppSelect={handleAppSelect}
      onCreateApp={() => router.push('/admin/apps/new')}
      onLogout={handleLogout}
    >
      <PageHeader
        title="Cron Job Monitor"
        description="Monitor and manage scheduled job executions"
        actions={
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        }
      />

      <div className="mt-6">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading cron job monitor...</div>
            </div>
          }
        >
          <CronJobMonitor />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
