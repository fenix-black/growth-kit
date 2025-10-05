'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import WaitlistManager from '../../components/WaitlistManager';
import EmailTemplateEditor from '../../components/EmailTemplateEditor';
import UsersLeadsManager from '../../components/UsersLeadsManager';
import ActivityAnalytics from '../../components/ActivityAnalytics';
import BrandingCard from '../../components/BrandingCard';
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
  FileText,
  DollarSign
} from 'lucide-react';

interface AppDetails {
  id: string;
  name: string;
  domain: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  waitlistLayout?: string;
  waitlistMessages?: string[];
  hideGrowthKitBranding?: boolean;
  isActive: boolean;
  corsOrigins: string[];
  redirectUrl: string;
  policyJson: any;
  publicKey?: string;
  waitlistEnabled: boolean;
  autoApproveWaitlist: boolean;
  invitationQuota: number;
  invitationCronTime?: string;
  trackUsdValue: boolean;
  allowCustomCredits: boolean;
  maxCustomCredits: number;
  initialCreditsPerDay: number;
  creditsPaused: boolean;
  creditsPausedAt?: string;
  todayUsdSpent?: number;
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
  { id: 'users-leads', name: 'Users & Leads', icon: Users },
  { id: 'waitlist', name: 'Waitlist', icon: Users },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'api-keys', name: 'API Tokens', icon: Key },
  { id: 'emails', name: 'Email Templates', icon: Mail },
];

export default function AppDetailDashboard({ appId }: { appId: string }) {
  const router = useRouter();
  const { apps } = useAdmin();
  const [app, setApp] = useState<AppDetails | null>(null);
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
          allowCustomCredits: appData.allowCustomCredits ?? true,
          maxCustomCredits: appData.maxCustomCredits ?? 100,
          initialCreditsPerDay: appData.initialCreditsPerDay ?? 3,
          creditsPaused: appData.creditsPaused ?? false,
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
          allowCustomCredits: editedApp.allowCustomCredits,
          maxCustomCredits: editedApp.maxCustomCredits,
          initialCreditsPerDay: editedApp.initialCreditsPerDay,
          creditsPaused: editedApp.creditsPaused,
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


  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopySuccess(type);
      setTimeout(() => setShowCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading || !app) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading app details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8" style={{ color: '#10b981' }} />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{app.name}</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {app.domain}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold',
              app.isActive ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-800'
            )}>
              {app.isActive ? 'Active' : 'Inactive'}
            </div>
            {app.creditsPaused && (
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-fenix-orange/10 text-fenix-orange">
                ⏸️ Credits Paused
              </div>
            )}
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
                          allowCustomCredits: app?.allowCustomCredits ?? true,
                          maxCustomCredits: app?.maxCustomCredits ?? 100,
                          initialCreditsPerDay: app?.initialCreditsPerDay ?? 3,
                          creditsPaused: app?.creditsPaused ?? false,
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
                        allowCustomCredits: app.allowCustomCredits ?? true,
                        maxCustomCredits: app.maxCustomCredits ?? 100,
                        initialCreditsPerDay: app.initialCreditsPerDay ?? 3,
                        creditsPaused: app.creditsPaused ?? false,
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
        </div>
      </div>

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
                  ? 'border-primary text-primary'
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
            
            {app.trackUsdValue && (
              <div className="mt-4 p-4 bg-fenix-orange/10 border border-fenix-orange/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-fenix-orange font-medium mb-1">USD Spent Today</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(app.todayUsdSpent || 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="text-fenix-orange" size={32} />
                </div>
              </div>
            )}
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
                <dt className="text-sm text-gray-500">API Tokens</dt>
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
                <dt className="text-sm text-gray-500">Daily Credits</dt>
                <dd className="text-sm font-medium">{app.initialCreditsPerDay} credits/day</dd>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">App Description</label>
                <textarea
                  value={isEditing ? (editedApp.description || '') : (app.description || '')}
                  onChange={(e) => setEditedApp({ ...editedApp, description: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
                  placeholder="Brief description of your app"
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
                      <ToggleRight className="h-6 w-6 text-primary" /> : 
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    }
                  </button>
                  <span className="text-sm font-medium text-gray-700">App Active</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-3">
                  <button
                    onClick={() => isEditing && setEditedApp({ ...editedApp, waitlistEnabled: !editedApp.waitlistEnabled })}
                    disabled={!isEditing}
                    className="cursor-pointer"
                  >
                    {(isEditing ? editedApp.waitlistEnabled : app.waitlistEnabled) ? 
                      <ToggleRight className="h-6 w-6 text-primary" /> : 
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    }
                  </button>
                  <span className="text-sm font-medium text-gray-700">Waitlist Enabled</span>
                </label>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="Advanced Settings">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Credits Amount
                </label>
                <input
                  type="number"
                  value={isEditing ? editedApp.initialCreditsPerDay : app.initialCreditsPerDay}
                  onChange={(e) => isEditing && setEditedApp({ ...editedApp, initialCreditsPerDay: parseInt(e.target.value) || 3 })}
                  disabled={!isEditing}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of credits automatically granted to users each day (0-100)
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <button
                    onClick={() => isEditing && setEditedApp({ ...editedApp, creditsPaused: !editedApp.creditsPaused })}
                    disabled={!isEditing}
                    className="cursor-pointer"
                  >
                    {(isEditing ? editedApp.creditsPaused : app.creditsPaused) ? 
                      <ToggleRight className="h-6 w-6 text-fenix-orange" /> : 
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    }
                  </button>
                  <span className="text-sm font-medium text-gray-700">Pause Credits</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-9">
                  Temporarily stop all credit earning (users can still spend existing credits)
                </p>
                {app.creditsPaused && app.creditsPausedAt && (
                  <p className="text-xs text-fenix-orange mt-1 ml-9">
                    Paused since: {new Date(app.creditsPausedAt).toLocaleString()}
                  </p>
                )}
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

          <ContentCard title="Credit Policy JSON">
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
                <div className="flex items-center space-x-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  <span>{policyJsonError}</span>
                </div>
              )}
              {isEditing && !policyJsonError && policyJsonText && (
                <div className="flex items-center space-x-2 text-primary text-sm">
                  <CheckCircle size={16} />
                  <span>Valid JSON format</span>
                </div>
              )}
            </div>
          </ContentCard>

          {(isEditing ? editedApp.waitlistEnabled : app.waitlistEnabled) && (
            <div className="col-span-2">
              <BrandingCard
                appId={appId}
                logoUrl={app.logoUrl}
                primaryColor={app.primaryColor}
                backgroundColor={app.backgroundColor}
                cardBackgroundColor={app.cardBackgroundColor}
                waitlistLayout={app.waitlistLayout}
                waitlistMessages={app.waitlistMessages}
                waitlistTargetSelector={(app as any).metadata?.waitlistTargetSelector}
                hideGrowthKitBranding={app.hideGrowthKitBranding}
                autoApprove={app.autoApproveWaitlist}
                invitationQuota={app.invitationQuota}
                invitationTime={app.invitationCronTime}
                onUpdate={fetchAppDetails}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'users-leads' && (
        <UsersLeadsManager
          appId={appId}
          appName={app.name}
          appDomain={app.domain}
          app={app}
          embedded={true}
          onClose={() => setActiveTab('overview')}
        />
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
        <ActivityAnalytics appId={appId} app={app} />
      )}

      {activeTab === 'api-keys' && (
        <ContentCard 
          title="API Tokens"
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
          {/* Public Key Section */}
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Public Key</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Safe for client-side usage. Use this in your widget initialization.
                </p>
              </div>
            </div>
            {app.publicKey ? (
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded border font-mono">
                  {app.publicKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Copy size={16} />}
                  onClick={() => handleCopyToClipboard(app.publicKey!, 'publicKey')}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30"
                >
                  {showCopySuccess === 'publicKey' ? <CheckCircle size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No public key generated yet</div>
            )}
          </div>

          {/* Private API Keys Section */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Private API Keys</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              These keys have full access to your app data. Keep them secure and never expose them in client-side code.
            </p>
          </div>

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
                          ? 'bg-primary/10 text-primary'
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
                icon={showCopySuccess === 'modal' ? <CheckCircle className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
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
    </>
  );
}
