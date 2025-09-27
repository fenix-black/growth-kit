'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// Lazy load heavy components
const WaitlistManager = lazy(() => import('./components/WaitlistManager'));
const EmailTemplateEditor = lazy(() => import('./components/EmailTemplateEditor'));
const UsdMetricsDashboard = lazy(() => import('./components/UsdMetricsDashboard'));
const InvitationCodesManager = lazy(() => import('./components/InvitationCodesManager'));
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
  Clock, 
  Plus,
  Settings,
  Mail,
  DollarSign,
  Ticket,
  Activity,
  TrendingUp
} from 'lucide-react';

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
}

export default function AdminDashboard() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showWaitlistManager, setShowWaitlistManager] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showUsdMetrics, setShowUsdMetrics] = useState(false);
  const [showInvitationCodes, setShowInvitationCodes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    corsOrigins: '',
    redirectUrl: '',
    policyJson: JSON.stringify({
      referralCredits: 5,
      referredCredits: 3,
      nameClaimCredits: 2,
      emailClaimCredits: 2,
      emailVerifyCredits: 5,
      dailyReferralCap: 10,
      actions: {
        default: { creditsRequired: 1 }
      }
    }, null, 2)
  });

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
        setApps(data.data.apps);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const corsOriginsArray = formData.corsOrigins
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const response = await fetch('/api/v1/admin/app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          ...formData,
          corsOrigins: corsOriginsArray,
          policyJson: JSON.parse(formData.policyJson),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.initialApiKey) {
          alert(`App created! API Key: ${data.data.initialApiKey}\n\nSave this key, it won't be shown again!`);
        }
        setShowCreateForm(false);
        setFormData({
          name: '',
          domain: '',
          corsOrigins: '',
          redirectUrl: '',
          policyJson: JSON.stringify({
            referralCredits: 5,
            referredCredits: 3,
            nameClaimCredits: 2,
            emailClaimCredits: 2,
            emailVerifyCredits: 5,
            dailyReferralCap: 10,
            actions: {
              default: { creditsRequired: 1 }
            }
          }, null, 2)
        });
        fetchApps();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error creating app. Check your policy JSON format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppSelect = (appId: string) => {
    router.push(`/admin/app/${appId}`);
  };

  // Calculate aggregate statistics
  const totalStats = apps.reduce((acc, app) => ({
    totalUsers: acc.totalUsers + app._count.fingerprints,
    totalReferrals: acc.totalReferrals + app._count.referrals,
    totalLeads: acc.totalLeads + app._count.leads,
    totalWaitlist: acc.totalWaitlist + app._count.waitlist,
  }), { totalUsers: 0, totalReferrals: 0, totalLeads: 0, totalWaitlist: 0 });

  const activeApps = apps.filter(app => app.isActive).length;

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
      onCreateApp={() => setShowCreateForm(true)}
      onLogout={handleLogout}
    >
      <PageHeader 
        title="Dashboard"
        description="Overview of your GrowthKit applications and metrics"
        actions={
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              icon={<Clock size={20} />}
              onClick={() => router.push('/admin/cron')}
            >
              Cron Monitor
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={20} />}
              onClick={() => setShowCreateForm(true)}
            >
              Create App
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Apps"
          value={apps.length}
          change={activeApps > 0 ? Math.round((activeApps / apps.length) * 100) : 0}
          changeLabel="active"
          icon={<Package size={24} />}
          color="primary"
        />
        <StatsCard
          title="Total Users"
          value={totalStats.totalUsers.toLocaleString()}
          icon={<Users size={24} />}
          color="secondary"
        />
        <StatsCard
          title="Total Referrals"
          value={totalStats.totalReferrals.toLocaleString()}
          icon={<Link size={24} />}
          color="primary"
        />
        <StatsCard
          title="Waitlist Entries"
          value={totalStats.totalWaitlist.toLocaleString()}
          icon={<FileText size={24} />}
          color="secondary"
        />
      </div>

      {/* Create App Form */}
      {showCreateForm && (
        <ContentCard 
          title="Create New App"
          className="mb-8"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          }
        >
          <form onSubmit={handleCreateApp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CORS Origins (comma-separated)
              </label>
              <input
                type="text"
                value={formData.corsOrigins}
                onChange={(e) => setFormData({ ...formData, corsOrigins: e.target.value })}
                placeholder="http://localhost:3000, https://example.com"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
              <input
                type="url"
                required
                value={formData.redirectUrl}
                onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy JSON</label>
              <textarea
                required
                value={formData.policyJson}
                onChange={(e) => setFormData({ ...formData, policyJson: e.target.value })}
                rows={10}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
              />
            </div>
            <div className="flex space-x-3">
              <Button
                type="submit"
                variant="success"
                loading={isSubmitting}
              >
                Create App
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </ContentCard>
      )}

      {/* Apps List */}
      <ContentCard 
        title="Your Applications"
        description="Manage and monitor all your GrowthKit applications"
        actions={
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
          </div>
        }
        noPadding={viewMode === 'table'}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAppSelect(app.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                    <p className="text-sm text-gray-500">{app.domain}</p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      app.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {app.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Users</p>
                    <p className="text-lg font-semibold">{app._count.fingerprints}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Referrals</p>
                    <p className="text-lg font-semibold">{app._count.referrals}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Leads</p>
                    <p className="text-lg font-semibold">{app._count.leads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Waitlist</p>
                    <p className="text-lg font-semibold">{app._count.waitlist}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Users size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                      setShowWaitlistManager(true);
                    }}
                  >
                    Waitlist
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Mail size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                      setShowEmailEditor(true);
                    }}
                  >
                    Emails
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<DollarSign size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                      setShowUsdMetrics(true);
                    }}
                  >
                    USD
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {app.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          app.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}
                      >
                        {app.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        Keys: {app._count.apiKeys} | Users: {app._count.fingerprints}
                        <br />
                        Referrals: {app._count.referrals} | Leads: {app._count.leads}
                        <br />
                        Waitlist: {app._count.waitlist}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Users size={16} />}
                          onClick={() => {
                            setSelectedApp(app);
                            setShowWaitlistManager(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Mail size={16} />}
                          onClick={() => {
                            setSelectedApp(app);
                            setShowEmailEditor(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<DollarSign size={16} />}
                          onClick={() => {
                            setSelectedApp(app);
                            setShowUsdMetrics(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Ticket size={16} />}
                          onClick={() => {
                            setSelectedApp(app);
                            setShowInvitationCodes(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Settings size={16} />}
                          onClick={() => handleAppSelect(app.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {/* Modals */}
      {showWaitlistManager && selectedApp && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-white">Loading Waitlist Manager...</div>
          </div>
        }>
          <WaitlistManager
            appId={selectedApp.id}
            appName={selectedApp.name}
            appDomain={selectedApp.domain}
            onClose={() => {
              setShowWaitlistManager(false);
              setSelectedApp(null);
              fetchApps();
            }}
          />
        </Suspense>
      )}
      
      {showEmailEditor && selectedApp && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-white">Loading Email Template Editor...</div>
          </div>
        }>
          <EmailTemplateEditor
            appId={selectedApp.id}
            appName={selectedApp.name}
            onClose={() => {
              setShowEmailEditor(false);
              setSelectedApp(null);
            }}
          />
        </Suspense>
      )}

      {showUsdMetrics && selectedApp && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">USD Metrics - {selectedApp.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUsdMetrics(false);
                    setSelectedApp(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <Suspense fallback={<div className="text-center py-4">Loading metrics...</div>}>
                <UsdMetricsDashboard
                  appId={selectedApp.id}
                  appName={selectedApp.name}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {showInvitationCodes && selectedApp && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Invitation Codes - {selectedApp.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowInvitationCodes(false);
                    setSelectedApp(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <Suspense fallback={<div className="text-center py-4">Loading invitation codes...</div>}>
                <InvitationCodesManager
                  appId={selectedApp.id}
                  appName={selectedApp.name}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}