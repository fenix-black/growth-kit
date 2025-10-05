'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import CronJobMonitor from '../components/CronJobMonitorEnhanced';

export default function CronDashboardPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8" style={{ color: '#10b981' }} />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cron Job Monitor</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor and manage scheduled job executions
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <CronJobMonitor />
      </div>
    </>
  );
}
