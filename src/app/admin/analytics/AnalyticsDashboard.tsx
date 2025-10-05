'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';
import StatsCard from '@/components/ui/StatsCard';
import Button from '@/components/ui/Button';
import { cn } from '@/components/ui/utils';
import { 
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  FileText
} from 'lucide-react';
import { 
  EChartsAreaChart,
  EChartsBarChart,
  EChartsPieChart,
  chartColorSchemes
} from '@/components/ui/charts';

interface UsdMetrics {
  summary: {
    totalRevenue: number;  // Actually totalSpent
    totalTransactions: number;
    uniqueUsers: number;
    avgTransactionValue: number;
    avgUserValue: number;
  };
  timeline?: Array<{
    period: string;
    revenue: number;  // Actually spent
    transactionCount: number;
    avgTransactionValue: number;
  }>;
  byUser?: Array<{
    fingerprintId: string;
    email?: string;
    name?: string;
    totalSpent: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
  byAction?: Array<{
    action: string;
    totalRevenue: number;  // Actually totalSpent
    transactionCount: number;
    avgTransactionValue: number;
  }>;
}

interface GeneralMetrics {
  overview: {
    totalFingerprints: number;
    totalReferrals: number;
    totalLeads: number;
    verifiedEmails: number;
    totalWaitlist: number;
    invitedWaitlist: number;
    totalCreditsIssued: number;
    totalCreditsConsumed: number;
  };
  conversion: {
    referralConversionRate: number;
    emailVerificationRate: number;
  };
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { apps } = useAdmin();
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [timeRange, setTimeRange] = useState('30d');
  const [groupBy, setGroupBy] = useState<'user' | 'action' | 'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usdMetrics, setUsdMetrics] = useState<UsdMetrics | null>(null);
  const [generalMetrics, setGeneralMetrics] = useState<GeneralMetrics | null>(null);

  useEffect(() => {
    if (apps.length > 0 || selectedAppId === '') {
      fetchMetrics();
    }
  }, [selectedAppId, timeRange, groupBy, apps]);

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      // Fetch general metrics
      const metricsUrl = selectedAppId 
        ? `/api/v1/admin/metrics?appId=${selectedAppId}`
        : '/api/v1/admin/metrics';
        
      const metricsResponse = await fetch(metricsUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setGeneralMetrics(data.data);
      }

      // Fetch USD metrics
      const period = timeRange === '7d' ? 'weekly' : timeRange === '30d' ? 'monthly' : 'all';
      const usdUrl = `/api/v1/admin/metrics/usd?period=${period}&groupBy=${groupBy}${selectedAppId ? `&appId=${selectedAppId}` : ''}`;
      
      const usdResponse = await fetch(usdUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (usdResponse.ok) {
        const data = await usdResponse.json();
        setUsdMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const handleExportCsv = async () => {
    try {
      const response = await fetch('/api/v1/admin/metrics/usd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          appId: selectedAppId || undefined,
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usd-metrics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <PageHeader 
        title="Analytics Dashboard"
        description="Detailed metrics and USD spending analysis"
        actions={
          <div className="flex space-x-3">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Apps</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">By Day</option>
              <option value="week">By Week</option>
              <option value="month">By Month</option>
              <option value="user">By User</option>
              <option value="action">By Action</option>
            </select>
            <Button
              variant="ghost"
              icon={<RefreshCw size={20} />}
              onClick={fetchMetrics}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              icon={<Download size={20} />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      {generalMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Credits Issued"
            value={generalMetrics.overview.totalCreditsIssued.toLocaleString()}
            icon={<Activity size={24} />}
            color="primary"
          />
          <StatsCard
            title="Credits Consumed"
            value={generalMetrics.overview.totalCreditsConsumed.toLocaleString()}
            icon={<TrendingUp size={24} />}
            color="purple"
          />
          <StatsCard
            title="Referral Conversion"
            value={`${generalMetrics.conversion.referralConversionRate.toFixed(1)}%`}
            icon={<Users size={24} />}
            color="secondary"
          />
          <StatsCard
            title="Email Verification"
            value={`${generalMetrics.conversion.emailVerificationRate.toFixed(1)}%`}
            icon={<FileText size={24} />}
            color="violet"
          />
          <StatsCard
            title="Credits Balance"
            value={(generalMetrics.overview.totalCreditsIssued - generalMetrics.overview.totalCreditsConsumed).toLocaleString()}
            icon={<BarChart3 size={24} />}
            color="magenta"
          />
        </div>
      )}

      {/* USD Metrics Summary */}
      {usdMetrics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total USD Spent"
            value={formatCurrency(usdMetrics.summary.totalRevenue)}
            icon={<DollarSign size={24} />}
            color="orange"
          />
          <StatsCard
            title="Total Transactions"
            value={usdMetrics.summary.totalTransactions.toLocaleString()}
            icon={<Activity size={24} />}
            color="pink"
          />
          <StatsCard
            title="Avg Transaction Value"
            value={formatCurrency(usdMetrics.summary.avgTransactionValue)}
            icon={<TrendingUp size={24} />}
            color="violet"
          />
          <StatsCard
            title="Avg User Spend"
            value={formatCurrency(usdMetrics.summary.avgUserValue)}
            icon={<Users size={24} />}
            color="magenta"
          />
        </div>
      )}

      {/* Charts based on groupBy selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Timeline Chart */}
        {usdMetrics?.timeline && (groupBy === 'day' || groupBy === 'week' || groupBy === 'month') && (
          <ContentCard
            title="USD Spending Over Time"
            description={`Grouped by ${groupBy}`}
            className="col-span-2"
          >
            <EChartsAreaChart
              data={usdMetrics.timeline}
              xKey="period"
              series={[
                { dataKey: 'revenue', name: 'USD Spent', type: 'area', gradient: true },
                { dataKey: 'transactionCount', name: 'Transactions', type: 'line' }
              ]}
              height={400}
              colorScheme="financial"
              formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value.toString()}
            />
          </ContentCard>
        )}

        {/* By Action Chart */}
        {usdMetrics?.byAction && groupBy === 'action' && (
          <>
            <ContentCard
              title="USD Spending by Action"
              description="Which actions consume the most value"
              className="col-span-1"
            >
              <EChartsBarChart
                data={usdMetrics.byAction}
                xKey="action"
                series={[
                  { dataKey: 'totalRevenue', name: 'Total Spent', color: '#d946ef' }
                ]}
                height={400}
                horizontal={true}
                colorScheme="financial"
                formatter={(value) => formatCurrency(value)}
                showLabel={true}
              />
            </ContentCard>

            <ContentCard
              title="Action Distribution"
              description="Percentage of spending by action type"
              className="col-span-1"
            >
              <EChartsPieChart
                data={usdMetrics.byAction.map((item: any) => ({ 
                  name: item.action, 
                  value: item.totalRevenue 
                }))}
                height={400}
                colorScheme="financial"
                formatter={(value) => formatCurrency(value)}
                donut={true}
              />
            </ContentCard>
          </>
        )}

        {/* By User Table */}
        {usdMetrics?.byUser && groupBy === 'user' && (
          <ContentCard
            title="Top Spenders"
            description="Users with highest USD consumption"
            className="col-span-2"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usdMetrics.byUser.slice(0, 10).map((user) => (
                    <tr key={user.fingerprintId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name || user.fingerprintId.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(user.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.transactionCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(user.avgTransactionValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentCard>
        )}
      </div>

      {/* Additional Insights */}
      <ContentCard
        title="Insights"
        description="Key observations from your data"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Credit Efficiency</h4>
            <p className="text-2xl font-bold text-blue-700">
              {generalMetrics && generalMetrics.overview.totalCreditsConsumed > 0
                ? `${((generalMetrics.overview.totalCreditsConsumed / generalMetrics.overview.totalCreditsIssued) * 100).toFixed(1)}%`
                : '0%'}
            </p>
            <p className="text-xs text-blue-600 mt-1">Credits consumed vs issued</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">Cost per Credit</h4>
            <p className="text-2xl font-bold text-green-700">
              {usdMetrics && generalMetrics && generalMetrics.overview.totalCreditsConsumed > 0
                ? formatCurrency(usdMetrics.summary.totalRevenue / generalMetrics.overview.totalCreditsConsumed)
                : '$0.00'}
            </p>
            <p className="text-xs text-green-600 mt-1">Average USD value per credit</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Active Users</h4>
            <p className="text-2xl font-bold text-purple-700">
              {usdMetrics?.summary.uniqueUsers || 0}
            </p>
            <p className="text-xs text-purple-600 mt-1">Users with USD transactions</p>
          </div>
        </div>
      </ContentCard>
    </>
  );
}
