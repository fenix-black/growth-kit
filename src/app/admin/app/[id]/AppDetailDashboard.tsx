'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import WaitlistManager from '../../components/WaitlistManager';
import EmailTemplateEditor from '../../components/EmailTemplateEditor';
import { cn } from '@/components/ui/utils';
import { 
  Settings,
  Users,
  Key,
  BarChart3,
  Mail,
  Save,
  Copy,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Edit2,
  X,
  Plus,
  Trash2,
  Clock,
  FileText
} from 'lucide-react';

interface AppDetails {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  corsOrigins: string[];
  redirectUrl: string;
  policyJson: any;
  waitlistEnabled: boolean;
  autoApproveWaitlist: boolean;
  invitationQuota: number;
  invitationCronTime?: string;
  trackUsdValue: boolean;
  createdAt: string;
  _count: {
    apiKeys: number;
    fingerprints: number;
    referrals: number;
    leads: number;
    waitlist: number;
  };
  apiKeys?: Array<{
    id: string;
    name: string;
    keyHint: string;
    scope: string;
    createdAt: string;
    lastUsedAt?: string;
    isActive: boolean;
    expiresAt?: string;
  }>;
}

const tabs = [
  { id: 'overview', name: 'Overview', icon: FileText },
  { id: 'settings', name: 'Settings', icon: Settings },
  { id: 'waitlist', name: 'Waitlist', icon: Users },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'api-keys', name: 'API Keys', icon: Key },
  { id: 'emails', name: 'Email Templates', icon: Mail },
];

export default function AppDetailDashboard({ appId }: { appId: string }) {
  const router = useRouter();
  const [app, setApp] = useState<AppDetails | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState<string | null>(null);
  const [editedApp, setEditedApp] = useState<Partial<AppDetails> & { corsOriginsText?: string }>({});
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  // JSON editing state
  const [policyJsonText, setPolicyJsonText] = useState<string>('');
  const [policyJsonError, setPolicyJsonError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppDetails();
    fetchAllApps();
  }, [appId]);

  const fetchAppDetails = async () => {
    try {
      const response = await fetch(`/api/v1/admin/app/${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const appData = data.data.app;
        setApp(appData);
        // Ensure all fields have default values to prevent uncontrolled input errors
        setEditedApp({
          ...appData,
          name: appData.name || '',
          domain: appData.domain || '',
          redirectUrl: appData.redirectUrl || '',
          invitationQuota: appData.invitationQuota ?? 10,
          invitationCronTime: appData.invitationCronTime || '12:00',
          corsOrigins: appData.corsOrigins || [],
          policyJson: appData.policyJson || {},
          isActive: appData.isActive ?? true,
          waitlistEnabled: appData.waitlistEnabled ?? false,
          autoApproveWaitlist: appData.autoApproveWaitlist ?? false,
          trackUsdValue: appData.trackUsdValue ?? false,
        });
        // Initialize JSON text state
        setPolicyJsonText(JSON.stringify(appData.policyJson || {}, null, 2));
        setPolicyJsonError(null);
      } else {
        router.push('/admin/apps');
      }
    } catch (error) {
      console.error('Error fetching app details:', error);
      router.push('/admin/apps');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllApps = async () => {
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
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Validate JSON before saving
      let policyJson = editedApp.policyJson;
      try {
        policyJson = JSON.parse(policyJsonText);
        setPolicyJsonError(null);
      } catch (error) {
        setPolicyJsonError('Invalid JSON format. Please fix the syntax before saving.');
        setIsSaving(false);
        return;
      }

      // Process corsOriginsText into array if it exists
      const corsOrigins = typeof editedApp.corsOriginsText !== 'undefined' 
        ? editedApp.corsOriginsText.split(',').map(s => s.trim()).filter(Boolean)
        : editedApp.corsOrigins;

      const response = await fetch(`/api/v1/admin/app/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          name: editedApp.name,
          domain: editedApp.domain,
          isActive: editedApp.isActive,
          corsOrigins: corsOrigins,
          redirectUrl: editedApp.redirectUrl,
          policyJson: policyJson,
          waitlistEnabled: editedApp.waitlistEnabled,
          autoApproveWaitlist: editedApp.autoApproveWaitlist,
          invitationQuota: editedApp.invitationQuota,
          invitationCronTime: editedApp.invitationCronTime,
          trackUsdValue: editedApp.trackUsdValue,
        }),
      });

      if (response.ok) {
        await fetchAppDetails();
        setIsEditing(false);
        // Clear the temporary text field
        setEditedApp(prev => ({ ...prev, corsOriginsText: undefined }));
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApp = async () => {
    if (!confirm(`Are you sure you want to delete "${app?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/app/${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        router.push('/admin/apps');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error deleting app');
    }
  };

  const handleCreateApiKey = async () => {
    const name = prompt('Enter a name for the new API key:');
    if (!name) return;

    try {
      const response = await fetch(`/api/v1/admin/apikey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({ appId, name }),
      });

      if (response.ok) {
        const data = await response.json();
        // The API key is in data.data.apiKey.key
        const apiKeyValue = data.data.apiKey.key;
        setNewApiKey(apiKeyValue);
        setShowApiKeyModal(true);
        fetchAppDetails();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error creating API key');
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const response = await fetch(`/api/v1/admin/apikey`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({ keyId }),
      });

      if (response.ok) {
        fetchAppDetails();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error revoking API key');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (loading || !app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      apps={apps}
      currentAppId={appId}
      onAppSelect={(id) => router.push(`/admin/app/${id}`)}
      onCreateApp={() => router.push('/admin/apps/new')}
      onLogout={handleLogout}
    >
      <PageHeader 
        title={app.name}
        description={app.domain}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Apps', href: '/admin/apps' },
          { label: app.name }
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <div className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold',
              app.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}>
              {app.isActive ? 'Active' : 'Inactive'}
            </div>
            {activeTab === 'settings' && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      variant="success"
                      icon={<Save size={20} />}
                      onClick={handleSaveSettings}
                      loading={isSaving}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      icon={<X size={20} />}
                      onClick={() => {
                        setIsEditing(false);
                        // Reset to original values with defaults
                        setEditedApp({
                          ...app,
                          name: app?.name || '',
                          domain: app?.domain || '',
                          redirectUrl: app?.redirectUrl || '',
                          invitationQuota: app?.invitationQuota ?? 10,
                          invitationCronTime: app?.invitationCronTime || '12:00',
                          corsOrigins: Array.isArray(app?.corsOrigins) ? app?.corsOrigins : (app?.corsOrigins ? [app?.corsOrigins] : []),
                          corsOriginsText: undefined, // Clear temporary text field
                          policyJson: app?.policyJson || {},
                          isActive: app?.isActive ?? true,
                          waitlistEnabled: app?.waitlistEnabled ?? false,
                          autoApproveWaitlist: app?.autoApproveWaitlist ?? false,
                          trackUsdValue: app?.trackUsdValue ?? false,
                        });
                        // Reset JSON text state
                        setPolicyJsonText(JSON.stringify(app?.policyJson || {}, null, 2));
                        setPolicyJsonError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    icon={<Edit2 size={20} />}
                    onClick={() => {
                      // Ensure all fields have default values when entering edit mode
                      setEditedApp({
                        ...app,
                        name: app.name || '',
                        domain: app.domain || '',
                        redirectUrl: app.redirectUrl || '',
                        invitationQuota: app.invitationQuota ?? 10,
                        invitationCronTime: app.invitationCronTime || '12:00',
                        corsOrigins: Array.isArray(app.corsOrigins) ? app.corsOrigins : (app.corsOrigins ? [app.corsOrigins] : []),
                        policyJson: app.policyJson || {},
                        isActive: app.isActive ?? true,
                        waitlistEnabled: app.waitlistEnabled ?? false,
                        autoApproveWaitlist: app.autoApproveWaitlist ?? false,
                        trackUsdValue: app.trackUsdValue ?? false,
                      });
                      // Initialize JSON text state for editing
                      setPolicyJsonText(JSON.stringify(app.policyJson || {}, null, 2));
                      setPolicyJsonError(null);
                      setIsEditing(true);
                    }}
                  >
                    Edit Settings
                  </Button>
                )}
              </>
            )}
            <Button
              variant="danger"
              icon={<Trash2 size={20} />}
              onClick={handleDeleteApp}
            >
              Delete App
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <div className="flex items-center space-x-2">
                <tab.icon size={18} />
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContentCard title="App Statistics">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold">{app._count.fingerprints.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Referrals</p>
                <p className="text-2xl font-bold">{app._count.referrals.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Leads</p>
                <p className="text-2xl font-bold">{app._count.leads.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Waitlist</p>
                <p className="text-2xl font-bold">{app._count.waitlist.toLocaleString()}</p>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="Configuration">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium">
                  {new Date(app.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">API Keys</dt>
                <dd className="text-sm font-medium">{app._count.apiKeys}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Waitlist Enabled</dt>
                <dd className="text-sm font-medium">{app.waitlistEnabled ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">USD Tracking</dt>
                <dd className="text-sm font-medium">{app.trackUsdValue ? 'Enabled' : 'Disabled'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Redirect URL</dt>
                <dd className="text-sm font-medium truncate">{app.redirectUrl}</dd>
              </div>
            </dl>
          </ContentCard>

          <ContentCard title="Credit Policy" className="col-span-2">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(app.policyJson, null, 2)}
            </pre>
          </ContentCard>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContentCard title="Basic Settings">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input
                  type="text"
                  value={isEditing ? (editedApp.name || '') : (app.name || '')}
                  onChange={(e) => setEditedApp({ ...editedApp, name: e.target.value })}
                  disabled={!isEditing}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={isEditing ? (editedApp.domain || '') : (app.domain || '')}
                  onChange={(e) => setEditedApp({ ...editedApp, domain: e.target.value })}
                  disabled={!isEditing}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
                <input
                  type="url"
                  value={isEditing ? (editedApp.redirectUrl || '') : (app.redirectUrl || '')}
                  onChange={(e) => setEditedApp({ ...editedApp, redirectUrl: e.target.value })}
                  disabled={!isEditing}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="flex items-center space-x-3">
                  <button
                    onClick={() => isEditing && setEditedApp({ ...editedApp, isActive: !editedApp.isActive })}
                    disabled={!isEditing}
                    className="cursor-pointer"
                  >
                    {(isEditing ? editedApp.isActive : app.isActive) ? 
                      <ToggleRight className="h-6 w-6 text-green-600" /> : 
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    }
                  </button>
                  <span className="text-sm font-medium text-gray-700">App Active</span>
                </label>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="CORS Origins">
            <div className="space-y-2">
              {isEditing ? (
                <textarea
                  value={typeof editedApp.corsOriginsText !== 'undefined' 
                    ? editedApp.corsOriginsText 
                    : (Array.isArray(editedApp.corsOrigins) ? editedApp.corsOrigins.join(', ') : '')}
                  onChange={(e) => setEditedApp({ 
                    ...editedApp, 
                    corsOriginsText: e.target.value
                  })}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="http://localhost:3000, https://example.com"
                />
              ) : (
                <div className="space-y-1">
                  {(Array.isArray(app.corsOrigins) ? app.corsOrigins : [app.corsOrigins]).filter(Boolean).map((origin, idx) => (
                    <div key={idx} className="px-3 py-2 bg-gray-50 rounded text-sm">
                      {origin}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ContentCard>

          <ContentCard title="Waitlist Settings">
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <button
                    onClick={() => isEditing && setEditedApp({ ...editedApp, waitlistEnabled: !editedApp.waitlistEnabled })}
                    disabled={!isEditing}
                    className="cursor-pointer"
                  >
                    {(isEditing ? editedApp.waitlistEnabled : app.waitlistEnabled) ? 
                      <ToggleRight className="h-6 w-6 text-green-600" /> : 
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    }
                  </button>
                  <span className="text-sm font-medium text-gray-700">Waitlist Enabled</span>
                </label>
              </div>
              {(isEditing ? editedApp.waitlistEnabled : app.waitlistEnabled) && (
                <>
                  <div>
                    <label className="flex items-center space-x-3">
                      <button
                        onClick={() => isEditing && setEditedApp({ ...editedApp, autoApproveWaitlist: !editedApp.autoApproveWaitlist })}
                        disabled={!isEditing}
                        className="cursor-pointer"
                      >
                        {(isEditing ? editedApp.autoApproveWaitlist : app.autoApproveWaitlist) ? 
                          <ToggleRight className="h-6 w-6 text-green-600" /> : 
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        }
                      </button>
                      <span className="text-sm font-medium text-gray-700">Auto-Approve</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Invitation Quota</label>
                    <input
                      type="number"
                      value={isEditing ? (editedApp.invitationQuota ?? 10) : (app.invitationQuota ?? 10)}
                      onChange={(e) => setEditedApp({ ...editedApp, invitationQuota: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Time</label>
                    <input
                      type="time"
                      value={isEditing ? (editedApp.invitationCronTime || '12:00') : (app.invitationCronTime || '12:00')}
                      onChange={(e) => setEditedApp({ ...editedApp, invitationCronTime: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
                    />
                  </div>
                </>
              )}
            </div>
          </ContentCard>

          <ContentCard title="Advanced Settings">
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <button
                    onClick={() => isEditing && setEditedApp({ ...editedApp, trackUsdValue: !editedApp.trackUsdValue })}
                    disabled={!isEditing}
                    className="cursor-pointer"
                  >
                    {(isEditing ? editedApp.trackUsdValue : app.trackUsdValue) ? 
                      <ToggleRight className="h-6 w-6 text-green-600" /> : 
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    }
                  </button>
                  <span className="text-sm font-medium text-gray-700">Track USD Value</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-9">
                  Enable tracking of USD expenses when credits are consumed
                </p>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="Credit Policy JSON" className="col-span-2">
            <div className="space-y-2">
              <textarea
                value={isEditing ? policyJsonText : JSON.stringify(app.policyJson, null, 2)}
                onChange={(e) => {
                  if (!isEditing) return;
                  
                  const text = e.target.value;
                  setPolicyJsonText(text);
                  
                  // Try to parse JSON and update state if valid
                  try {
                    const parsed = JSON.parse(text);
                    setEditedApp({ ...editedApp, policyJson: parsed });
                    setPolicyJsonError(null);
                  } catch (error) {
                    // Show error but still allow editing
                    setPolicyJsonError('Invalid JSON syntax');
                  }
                }}
                disabled={!isEditing}
                rows={15}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs disabled:bg-gray-50"
                placeholder="Enter valid JSON for the credit policy..."
              />
              {isEditing && policyJsonError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{policyJsonError}</span>
                </div>
              )}
              {isEditing && !policyJsonError && policyJsonText && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle size={16} />
                  <span>Valid JSON format</span>
                </div>
              )}
            </div>
          </ContentCard>
        </div>
      )}

      {activeTab === 'waitlist' && (
        <WaitlistManager
          appId={appId}
          appName={app.name}
          appDomain={app.domain}
          embedded={true}
          onClose={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'analytics' && (
        <ContentCard title="App Analytics">
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Analytics data for this app will be displayed here</p>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/analytics?appId=${appId}`)}
              className="mt-4"
            >
              View in Analytics Dashboard
            </Button>
          </div>
        </ContentCard>
      )}

      {activeTab === 'api-keys' && (
        <ContentCard 
          title="API Keys"
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={handleCreateApiKey}
            >
              Create New Key
            </Button>
          }
        >
          {app.apiKeys && app.apiKeys.length > 0 ? (
            <div className="space-y-3">
              {app.apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{apiKey.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                      {apiKey.lastUsedAt && ` | Last used: ${new Date(apiKey.lastUsedAt).toLocaleDateString()}`}
                      {apiKey.expiresAt && ` | Expires: ${new Date(apiKey.expiresAt).toLocaleDateString()}`}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded font-mono">
                        {apiKey.keyHint}****
                      </code>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Key hint (full key hidden)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        apiKey.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}
                    >
                      {apiKey.isActive ? 'Active' : 'Revoked'}
                    </span>
                    {apiKey.isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRevokeApiKey(apiKey.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No API keys created yet</p>
            </div>
          )}
        </ContentCard>
      )}

      {activeTab === 'emails' && (
        <EmailTemplateEditor
          appId={appId}
          appName={app.name}
          embedded={true}
          onClose={() => setActiveTab('overview')}
        />
      )}

      {/* API Key Modal */}
      {showApiKeyModal && newApiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              API Key Created Successfully
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Save this key now. It won't be shown again!
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-4">
              <code className="text-sm text-gray-900 dark:text-gray-100 break-all font-mono">
                {newApiKey}
              </code>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(newApiKey);
                  setShowCopySuccess('modal');
                  setTimeout(() => setShowCopySuccess(null), 2000);
                }}
                icon={showCopySuccess === 'modal' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              >
                {showCopySuccess === 'modal' ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setNewApiKey(null);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
