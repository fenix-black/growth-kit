'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create App
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
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
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Create App
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
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
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/app/${app.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
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
    </div>
  );
}
