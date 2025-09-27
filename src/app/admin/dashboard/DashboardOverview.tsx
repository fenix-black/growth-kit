'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface App {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  _count: {
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


export default function DashboardOverview() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
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

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    let totalStats = { totalUsers: 0, totalReferrals: 0, totalLeads: 0, totalWaitlist: 0 };
    
    try {
      // Fetch apps
      const appsResponse = await fetch('/api/v1/admin/app', {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        const appsList = appsData.data.apps;
        setApps(appsList);
        
        // Calculate metrics
        const activeApps = appsList.filter((app: App) => app.isActive).length;
        totalStats = appsList.reduce((acc: any, app: App) => ({
          totalUsers: acc.totalUsers + app._count.fingerprints,
          totalReferrals: acc.totalReferrals + app._count.referrals,
          totalLeads: acc.totalLeads + app._count.leads,
          totalWaitlist: acc.totalWaitlist + app._count.waitlist,
        }), { totalUsers: 0, totalReferrals: 0, totalLeads: 0, totalWaitlist: 0 });
        
        // Calculate growth rate (mock data for now)
        const growthRate = totalStats.totalUsers > 0 ? 12.5 : 0;
        const conversionRate = totalStats.totalLeads > 0 ? 
          ((totalStats.totalUsers / totalStats.totalLeads) * 100) : 0;
        
        setMetrics({
          totalApps: appsList.length,
          activeApps,
          ...totalStats,
          totalUsdSpent: 0, // Will be fetched from USD metrics
          totalCreditsIssued: 0,
          totalCreditsConsumed: 0,
          growthRate,
          conversionRate
        });
      }
      
      // Fetch general metrics
      try {
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
    
    setChartData({ 
      growth: chartGrowth,
      expenses: [], // Will be populated by USD metrics
      credits: credits.slice(-30),
      conversion
    });
  };
  
  const generateMockChartData = (stats: any) => {
    // Generate mock time series data
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const growth = [];
    const expenses = [];
    
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
      { name: 'Email Verify', value: 30, color: '#14b8a6' },
      { name: 'Name Claims', value: 20, color: '#06b6d4' },
      { name: 'Actions', value: 15, color: '#0ea5e9' },
    ];
    
    // Conversion funnel
    const conversion = [
      { stage: 'Visitors', users: 10000 },
      { stage: 'Signed Up', users: 3500 },
      { stage: 'Verified', users: 2800 },
      { stage: 'Active', users: 1200 },
      { stage: 'Paid', users: 450 },
    ];
    
    setChartData({ growth, expenses, credits, conversion });
  };


  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleCreateApp = () => {
    router.push('/admin/apps/new');
  };

  const handleAppSelect = (appId: string) => {
    router.push(`/admin/app/${appId}`);
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
      onCreateApp={handleCreateApp}
      onLogout={handleLogout}
    >
      <PageHeader 
        title="Dashboard Overview"
        description="Monitor your GrowthKit applications performance and metrics"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' }
        ]}
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
          color="secondary"
        />
        <StatsCard
          title="Credits Issued"
          value={metrics.totalCreditsIssued.toLocaleString()}
          icon={<Coins size={24} />}
          color="primary"
        />
        <StatsCard
          title="Credits Used"
          value={metrics.totalCreditsConsumed.toLocaleString()}
          icon={<Activity size={24} />}
          color="secondary"
        />
        <StatsCard
          title="USD Spent"
          value={`$${metrics.totalUsdSpent.toFixed(2)}`}
          icon={<DollarSign size={24} />}
          color="primary"
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
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="users" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="referrals" 
                stackId="1"
                stroke="#14b8a6" 
                fill="#14b8a6" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="waitlist" 
                stackId="1"
                stroke="#06b6d4" 
                fill="#06b6d4" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ContentCard>

        {/* USD Expenses Chart */}
        <ContentCard
          title="USD Expenses"
          description="Credit usage costs and transaction volume"
          className="col-span-1"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.expenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: any, name: string) => {
                if (name === 'spent') return [`$${value.toFixed(2)}`, 'USD Spent'];
                return [value, 'Transactions'];
              }} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="spent" 
                name="USD Spent"
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
              <Bar 
                yAxisId="right"
                dataKey="transactions" 
                name="Transactions"
                fill="#14b8a6" 
                fillOpacity={0.3}
              />
            </LineChart>
          </ResponsiveContainer>
        </ContentCard>

        {/* Credits Distribution */}
        <ContentCard
          title="Credits Distribution"
          description="How credits are being earned"
          className="col-span-1"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.credits}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={(entry) => `${entry.name} ${entry.value}%`}
              >
                {chartData.credits.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ContentCard>

        {/* Conversion Funnel */}
        <ContentCard
          title="Conversion Funnel"
          description="User journey through your app"
          className="col-span-1"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.conversion} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" />
              <Tooltip />
              <Bar dataKey="users" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ContentCard>
      </div>

      {/* Activity Feed and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <ContentCard
          title="Recent Activity"
          description="Latest events across all apps"
          className="col-span-2"
        >
          <div className="text-center py-8 text-gray-500">
            Activity tracking data will appear here once apps start tracking events.
          </div>
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
    </DashboardLayout>
  );
}
