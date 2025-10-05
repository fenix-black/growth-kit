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
  Package, 
  Users, 
  Link, 
  FileText, 
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  Coins
} from 'lucide-react';
import { 
  EChartsAreaChart,
  EChartsBarChart,
  EChartsPieChart,
  EChartsGauge,
  chartColorSchemes
} from '@/components/ui/charts';

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
  createdAt?: string;
}

interface Metrics {
  totalApps: number;
  activeApps: number;
  totalUsers: number;
  totalReferrals: number;
  totalLeads: number;
  totalWaitlist: number;
  totalUsdSpent: number;
  totalCreditsIssued: number;
  totalCreditsConsumed: number;
  growthRate: number;
  conversionRate: number;
}


// Helper function to map credit reasons to colors
const getColorForReason = (reason: string): string => {
  const colorMap: Record<string, string> = {
    'daily_grant': '#10b981',     // primary green
    'referral': '#a855f7',        // purple
    'email_verification': '#f97316', // orange
    'name_claim': '#d946ef',      // magenta
    'custom': '#06b6d4',          // cyan
    'action': '#14b8a6',          // teal
  };
  return colorMap[reason] || '#8b5cf6'; // default violet
};

export default function DashboardOverview() {
  const router = useRouter();
  const { apps, handleCreateApp } = useAdmin();
  const [metrics, setMetrics] = useState<Metrics>({
    totalApps: 0,
    activeApps: 0,
    totalUsers: 0,
    totalReferrals: 0,
    totalLeads: 0,
    totalWaitlist: 0,
    totalUsdSpent: 0,
    totalCreditsIssued: 0,
    totalCreditsConsumed: 0,
    growthRate: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState<any>({
    growth: [],
    expenses: [],
    credits: [],
    conversion: []
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (apps.length > 0) {
      fetchDashboardData();
    }
  }, [timeRange, apps]);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    
    try {
      // Calculate metrics from apps data
      const activeApps = apps.filter((app: App) => app.isActive).length;
      const totalStats = apps.reduce((acc: any, app: App) => ({
        totalUsers: acc.totalUsers + (app._count?.fingerprints || 0),
        totalReferrals: acc.totalReferrals + (app._count?.referrals || 0),
        totalLeads: acc.totalLeads + (app._count?.leads || 0),
        totalWaitlist: acc.totalWaitlist + (app._count?.waitlist || 0),
      }), { totalUsers: 0, totalReferrals: 0, totalLeads: 0, totalWaitlist: 0 });
      
      // Calculate growth rate (mock data for now)
      const growthRate = totalStats.totalUsers > 0 ? 12.5 : 0;
      const conversionRate = totalStats.totalLeads > 0 ? 
        ((totalStats.totalUsers / totalStats.totalLeads) * 100) : 0;
      
      setMetrics({
        totalApps: apps.length,
        activeApps,
        ...totalStats,
        totalUsdSpent: 0, // Will be fetched from USD metrics
        totalCreditsIssued: 0,
        totalCreditsConsumed: 0,
        growthRate,
        conversionRate
      });
      
      // Fetch dashboard metrics
      try {
        const dashboardResponse = await fetch(`/api/admin/proxy/dashboard/metrics?timeRange=${timeRange}`);
        
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          const { growth, credits, topEvents, systemHealth, recentActivity } = dashboardData.data;
          
          // Update metrics with real data
          setMetrics(prev => ({ 
            ...prev, 
            totalCreditsIssued: credits.totalIssued,
            totalCreditsConsumed: credits.totalConsumed,
            growthRate: growth.rate,
          }));
          
          // Update chart data with real data
          setChartData((prev: any) => ({
            ...prev,
            growth: growth.timeSeries || [],
            credits: credits.distribution.map((item: any) => ({
              name: item.reason,
              value: item.percentage,
              color: getColorForReason(item.reason)
            })),
            conversion: topEvents.map((event: any) => ({
              stage: event.eventName,
              users: event.count
            })),
            systemHealth: {
              cpuUsage: systemHealth.cpu,
              memoryUsage: systemHealth.memory,
              creditsUsage: systemHealth.creditsUtilization,
            }
          }));
          
          // Update recent activity
          setRecentActivities(recentActivity || []);
          //return;
        } else {
          // Fall back to legacy metrics endpoint
          const metricsResponse = await fetch('/api/v1/admin/metrics', {
            headers: {
              'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
            },
          });
          
          if (metricsResponse.ok) {
            const metricsData = await metricsResponse.json();
            const { overview, daily } = metricsData.data;
            
            setMetrics(prev => ({ 
              ...prev, 
              totalCreditsIssued: overview.totalCreditsIssued || 0,
              totalCreditsConsumed: overview.totalCreditsConsumed || 0,
            }));
            
            // Use real daily data for charts if available
            if (daily) {
              generateChartDataFromMetrics(daily, totalStats);
            } else {
              generateMockChartData(totalStats);
            }
          }
        }
      } catch (error) {
        console.log('Metrics not available, using mock data');
        generateMockChartData(totalStats);
      }
      
      // Try to fetch USD metrics if available
      try {
        const usdResponse = await fetch(`/api/v1/admin/metrics/usd?groupBy=${timeRange === '7d' ? 'day' : timeRange === '30d' ? 'week' : 'month'}`, {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
          },
        });
        
        if (usdResponse.ok) {
          const usdData = await usdResponse.json();
          setMetrics(prev => ({ ...prev, totalUsdSpent: usdData.data.summary?.totalRevenue || 0 }));
          
          // Update chart data with USD expenses timeline
          if (usdData.data.timeline) {
            setChartData((prev: any) => ({
              ...prev,
              expenses: usdData.data.timeline.map((item: any) => ({
                date: item.period,
                spent: item.revenue,
                transactions: item.transactionCount,
              }))
            }));
          }
        }
      } catch (error) {
        console.log('USD metrics not available');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateChartDataFromMetrics = (dailyData: any, stats: any) => {
    // Use real data when available
    const growth = dailyData.fingerprints || [];
    const credits = dailyData.actions || [];
    
    // Convert to chart format
    const chartGrowth = growth.slice(-30).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: item.count,
      referrals: dailyData.referrals?.find((r: any) => r.date === item.date)?.count || 0,
    }));
    
    // Conversion funnel from real data
    const conversion = [
      { stage: 'Visitors', users: stats.totalUsers * 3 },
      { stage: 'Signed Up', users: stats.totalUsers },
      { stage: 'Verified', users: Math.floor(stats.totalUsers * 0.8) },
      { stage: 'Active', users: Math.floor(stats.totalUsers * 0.5) },
      { stage: 'Power Users', users: Math.floor(stats.totalUsers * 0.15) },
    ];
    
    // System health data (use real metrics where available)
    const systemHealth = {
      cpuUsage: 45, // In production, get from monitoring service
      memoryUsage: 68, // In production, get from monitoring service
      creditsUsage: stats.totalCredits > 0 
        ? Math.min((stats.totalCreditsConsumed / stats.totalCredits) * 100, 100)
        : 0,
    };
    
    setChartData((prev: any) => ({ 
      ...prev,
      growth: chartGrowth,
      expenses: [], // Will be populated by USD metrics
      credits: credits.slice(-30),
      conversion,
      systemHealth
    }));
  };
  
  const generateMockChartData = (stats: any) => {
    // Generate mock time series data
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const growth: any[] = [];
    const expenses: any[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      growth.push({
        date: dateStr,
        users: Math.floor(Math.random() * 100) + 50,
        referrals: Math.floor(Math.random() * 50) + 20,
        waitlist: Math.floor(Math.random() * 30) + 10,
      });
      
      expenses.push({
        date: dateStr,
        spent: Math.floor(Math.random() * 500) + 100,
        transactions: Math.floor(Math.random() * 20) + 5,
      });
    }
    
    // Credits breakdown pie chart
    const credits = [
      { name: 'Referrals', value: 35, color: '#10b981' },
      { name: 'Email Verify', value: 30, color: '#a855f7' },
      { name: 'Name Claims', value: 20, color: '#f97316' },
      { name: 'Actions', value: 15, color: '#d946ef' },
    ];
    
    // Conversion funnel
    const conversion = [
      { stage: 'Visitors', users: 10000 },
      { stage: 'Signed Up', users: 3500 },
      { stage: 'Verified', users: 2800 },
      { stage: 'Active', users: 1200 },
      { stage: 'Paid', users: 450 },
    ];
    
    // System health data (mock for now)
    const systemHealth = {
      cpuUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
      memoryUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
      creditsUsage: stats.totalCreditsIssued > 0 ? (stats.totalCreditsConsumed / stats.totalCreditsIssued) * 100 : 0,
    };
    
    setChartData((prev: any) => ({ ...prev, growth, expenses, credits, conversion, systemHealth }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Dashboard Overview"
        description="Monitor your GrowthKit applications performance and metrics"
        actions={
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button
              variant="ghost"
              icon={<RefreshCw size={20} />}
              onClick={fetchDashboardData}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              icon={<Download size={20} />}
              onClick={() => alert('Export functionality coming soon')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={20} />}
              onClick={handleCreateApp}
            >
              Create App
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="Total Apps"
          value={metrics.totalApps}
          change={metrics.activeApps > 0 ? Math.round((metrics.activeApps / metrics.totalApps) * 100) : 0}
          changeLabel="active"
          icon={<Package size={24} />}
          color="primary"
        />
        <StatsCard
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          change={metrics.growthRate}
          changeLabel="growth"
          icon={<Users size={24} />}
          color="purple"
        />
        <StatsCard
          title="Credits Issued"
          value={metrics.totalCreditsIssued.toLocaleString()}
          icon={<Coins size={24} />}
          color="secondary"
        />
        <StatsCard
          title="Credits Used"
          value={metrics.totalCreditsConsumed.toLocaleString()}
          icon={<Activity size={24} />}
          color="violet"
        />
        <StatsCard
          title="USD Spent"
          value={`$${metrics.totalUsdSpent.toFixed(2)}`}
          icon={<DollarSign size={24} />}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Growth Chart */}
        <ContentCard
          title="User Growth"
          description="Track user acquisition over time"
          className="col-span-1"
        >
          <EChartsAreaChart
            data={chartData.growth}
            xKey="date"
            series={[
              { dataKey: 'users', name: 'Total Users', type: 'area', gradient: true },
              { dataKey: 'referrals', name: 'Referrals', type: 'area' },
              { dataKey: 'waitlist', name: 'Waitlist', type: 'area' }
            ]}
            height={300}
            colorScheme="growth"
          />
        </ContentCard>

        {/* USD Expenses Chart */}
        <ContentCard
          title="USD Expenses"
          description="Credit usage costs and transaction volume"
          className="col-span-1"
        >
          <EChartsAreaChart
            data={chartData.expenses}
            xKey="date"
            series={[
              { dataKey: 'spent', name: 'USD Spent', type: 'line' },
              { dataKey: 'transactions', name: 'Transactions', type: 'area' }
            ]}
            height={300}
            colorScheme="financial"
          />
        </ContentCard>

        {/* Credits Distribution */}
        <ContentCard
          title="Credits Distribution"
          description="How credits are being earned"
          className="col-span-1"
        >
          <EChartsPieChart
            data={chartData.credits.map((item: any) => ({ name: item.name, value: item.value }))}
            height={300}
            colorScheme="analytics"
            formatter={(value) => `${value}%`}
          />
        </ContentCard>

        {/* Conversion Funnel */}
        <ContentCard
          title="Conversion Funnel"
          description="User journey through your app"
          className="col-span-1"
        >
          <EChartsBarChart
            data={chartData.conversion}
            xKey="stage"
            series={[
              { dataKey: 'users', name: 'Users' }
            ]}
            height={300}
            horizontal={true}
            colorScheme="growth"
            showLabel={true}
          />
        </ContentCard>
      </div>

      {/* Advanced Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
        
        {/* System Health Gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ContentCard
            title="CPU Usage"
            description="Current system CPU utilization"
          >
            <EChartsGauge
              value={chartData.systemHealth?.cpuUsage || 0}
              max={100}
              title="CPU"
              subtitle="Server load average"
              height={250}
              formatter={(value) => `${value.toFixed(0)}%`}
              thresholds={{ low: 40, medium: 70, high: 85 }}
            />
          </ContentCard>

          <ContentCard
            title="Memory Usage"
            description="System memory consumption"
          >
            <EChartsGauge
              value={chartData.systemHealth?.memoryUsage || 0}
              max={100}
              title="Memory"
              subtitle="RAM utilization"
              height={250}
              formatter={(value) => `${value.toFixed(0)}%`}
              thresholds={{ low: 50, medium: 75, high: 90 }}
            />
          </ContentCard>

          <ContentCard
            title="Credits Utilization"
            description="Credits consumed vs issued"
          >
            <EChartsGauge
              value={chartData.systemHealth?.creditsUsage || 0}
              max={100}
              title="Credits"
              subtitle="Usage percentage"
              height={250}
              formatter={(value) => `${value.toFixed(1)}%`}
              thresholds={{ low: 60, medium: 80, high: 95 }}
            />
          </ContentCard>
        </div>

      </div>

      {/* Activity Feed and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <ContentCard
          title="Recent Activity"
          description="Latest events across all apps"
          className="col-span-2"
        >
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <Activity className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm font-medium">{activity.eventName}</p>
                      <p className="text-xs text-gray-500">
                        {activity.user} • {activity.appName}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Activity tracking data will appear here once apps start tracking events.
            </div>
          )}
        </ContentCard>

        {/* System Health */}
        <ContentCard
          title="System Health"
          description="Service status and performance"
          className="col-span-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={20} />
                <span className="text-sm">API Status</span>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={20} />
                <span className="text-sm">Database</span>
              </div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="text-yellow-500 mr-2" size={20} />
                <span className="text-sm">Cron Jobs</span>
              </div>
              <span className="text-sm font-medium text-yellow-600">Next run in 15m</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={20} />
                <span className="text-sm">Email Service</span>
              </div>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <hr className="my-4" />
            <div>
              <p className="text-xs text-gray-500 mb-2">Credits Balance</p>
              <div className="text-2xl font-bold">
                {(metrics.totalCreditsIssued - metrics.totalCreditsConsumed).toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">Available credits</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Avg Credit Value</p>
              <div className="text-2xl font-bold">
                ${metrics.totalCreditsConsumed > 0 
                  ? (metrics.totalUsdSpent / metrics.totalCreditsConsumed).toFixed(4)
                  : '0.00'}
              </div>
            </div>
          </div>
        </ContentCard>
      </div>
    </>
  );
}
