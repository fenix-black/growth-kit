'use client';

import PageHeader from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CronJobMonitor from '../components/CronJobMonitorEnhanced';

export default function CronDashboardPage() {
  return (
    <>
      <PageHeader
        title="Cron Job Monitor"
        description="Monitor and manage scheduled job executions"
        actions={
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        }
      />

      <div className="mt-6">
        <CronJobMonitor />
      </div>
    </>
  );
}
