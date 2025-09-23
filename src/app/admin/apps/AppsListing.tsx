'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WaitlistManager from '../components/WaitlistManager';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import UsdMetricsDashboard from '../components/UsdMetricsDashboard';
import InvitationCodesManager from '../components/InvitationCodesManager';
import DashboardLayout from '@/components/ui/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { cn } from '@/components/ui/utils';
import { 
  Package, 
  Users, 
  Plus,
  Settings,
  Mail,
  DollarSign,
  Ticket,
  Filter,
  Search,
  Grid3x3,
  List
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

export default function AppsListing() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showWaitlistManager, setShowWaitlistManager] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showUsdMetrics, setShowUsdMetrics] = useState(false);
  const [showInvitationCodes, setShowInvitationCodes] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

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

  const handleAppSelect = (appId: string) => {
    router.push(`/admin/app/${appId}`);
  };

  const handleCreateApp = () => {
    router.push('/admin/apps/new');
  };

  // Filter apps based on search and status
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && app.isActive) ||
                         (filterStatus === 'inactive' && !app.isActive);
    return matchesSearch && matchesStatus;
  });

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
      currentAppId={selectedApp?.id}
    >
      <PageHeader 
        title="Applications"
        description="Manage and monitor all your GrowthKit applications"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Apps' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={20} />}
            onClick={handleCreateApp}
          >
            Create App
          </Button>
        }
      />

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search apps by name or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Apps List */}
      <ContentCard 
        noPadding={viewMode === 'table'}
      >
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No apps found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first app'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button
                variant="primary"
                icon={<Plus size={20} />}
                onClick={handleCreateApp}
              >
                Create Your First App
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleAppSelect(app.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{app.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{app.domain}</p>
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
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Users</p>
                    <p className="text-lg font-semibold">{app._count.fingerprints.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Referrals</p>
                    <p className="text-lg font-semibold">{app._count.referrals.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Leads</p>
                    <p className="text-lg font-semibold">{app._count.leads.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">Waitlist</p>
                    <p className="text-lg font-semibold">{app._count.waitlist.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    icon={<Settings size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppSelect(app.id);
                    }}
                  >
                    Manage
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
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waitlist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApps.map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAppSelect(app.id)}
                  >
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
                      {app._count.fingerprints.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app._count.referrals.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app._count.waitlist.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Mail size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            setShowEmailEditor(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<DollarSign size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            setShowUsdMetrics(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Ticket size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            setShowInvitationCodes(true);
                          }}
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
      )}
      
      {showEmailEditor && selectedApp && (
        <EmailTemplateEditor
          appId={selectedApp.id}
          appName={selectedApp.name}
          onClose={() => {
            setShowEmailEditor(false);
            setSelectedApp(null);
          }}
        />
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
              <UsdMetricsDashboard
                appId={selectedApp.id}
                appName={selectedApp.name}
              />
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
              <InvitationCodesManager
                appId={selectedApp.id}
                appName={selectedApp.name}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
