'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WaitlistManager from './components/WaitlistManager';
import EmailTemplateEditor from './components/EmailTemplateEditor';
import UsdMetricsDashboard from './components/UsdMetricsDashboard';
import InvitationCodesManager from './components/InvitationCodesManager';

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
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
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
    
    if (isSubmitting) return; // Prevent double submission
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">GrowthKit Admin</h1>
              <div className="space-x-4">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Create App
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>

            {showCreateForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-lg font-semibold mb-4">Create New App</h2>
                <form onSubmit={handleCreateApp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Domain</label>
                    <input
                      type="text"
                      required
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CORS Origins (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.corsOrigins}
                      onChange={(e) => setFormData({ ...formData, corsOrigins: e.target.value })}
                      placeholder="http://localhost:3000, https://example.com"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Redirect URL</label>
                    <input
                      type="url"
                      required
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Policy JSON</label>
                    <textarea
                      required
                      value={formData.policyJson}
                      onChange={(e) => setFormData({ ...formData, policyJson: e.target.value })}
                      rows={10}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-md text-white cursor-pointer ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? 'Creating...' : 'Create App'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
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
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.domain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            app.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
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
                        <button
                          onClick={() => {
                            if (actionInProgress) return;
                            setActionInProgress('waitlist');
                            setSelectedApp(app);
                            setShowWaitlistManager(true);
                            setTimeout(() => setActionInProgress(null), 500);
                          }}
                          disabled={actionInProgress !== null}
                          className={`mr-2 cursor-pointer ${
                            actionInProgress ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          Waitlist
                        </button>
                        <button
                          onClick={() => {
                            if (actionInProgress) return;
                            setActionInProgress('emails');
                            setSelectedApp(app);
                            setShowEmailEditor(true);
                            setTimeout(() => setActionInProgress(null), 500);
                          }}
                          disabled={actionInProgress !== null}
                          className={`mr-2 cursor-pointer ${
                            actionInProgress ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          Emails
                        </button>
                        <button
                          onClick={() => {
                            if (actionInProgress) return;
                            setActionInProgress('usd');
                            setSelectedApp(app);
                            setShowUsdMetrics(true);
                            setTimeout(() => setActionInProgress(null), 500);
                          }}
                          disabled={actionInProgress !== null}
                          className={`mr-2 cursor-pointer ${
                            actionInProgress ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          💵 USD
                        </button>
                        <button
                          onClick={() => {
                            if (actionInProgress) return;
                            setActionInProgress('codes');
                            setSelectedApp(app);
                            setShowInvitationCodes(true);
                            setTimeout(() => setActionInProgress(null), 500);
                          }}
                          disabled={actionInProgress !== null}
                          className={`mr-2 cursor-pointer ${
                            actionInProgress ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-900'
                          }`}
                        >
                          🎫 Codes
                        </button>
                        <button
                          onClick={() => {
                            if (actionInProgress) return;
                            setActionInProgress('manage');
                            router.push(`/admin/app/${app.id}`);
                          }}
                          disabled={actionInProgress !== null}
                          className={`cursor-pointer ${
                            actionInProgress ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {showWaitlistManager && selectedApp && (
        <WaitlistManager
          appId={selectedApp.id}
          appName={selectedApp.name}
          onClose={() => {
            setShowWaitlistManager(false);
            setSelectedApp(null);
            fetchApps(); // Refresh data
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
                <button
                  onClick={() => {
                    setShowUsdMetrics(false);
                    setSelectedApp(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
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
                <button
                  onClick={() => {
                    setShowInvitationCodes(false);
                    setSelectedApp(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <InvitationCodesManager
                appId={selectedApp.id}
                appName={selectedApp.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
