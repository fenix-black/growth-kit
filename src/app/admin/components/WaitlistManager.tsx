'use client';

import { useState, useEffect } from 'react';

interface WaitlistEntry {
  id: string;
  email: string;
  status: 'WAITING' | 'INVITED' | 'ACCEPTED';
  position: number | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  invitedVia: string | null;
  createdAt: string;
}

interface WaitlistConfig {
  waitlistEnabled: boolean;
  waitlistMessage: string | null;
  autoInviteEnabled: boolean;
  dailyInviteQuota: number;
  inviteTime: string;
  masterReferralCode: string | null;
  masterReferralCredits: number;
}

interface WaitlistManagerProps {
  appId: string;
  appName: string;
  onClose?: () => void;
  embedded?: boolean;
}

export default function WaitlistManager({ appId, appName, onClose, embedded = false }: WaitlistManagerProps) {
  const [activeTab, setActiveTab] = useState<'entries' | 'settings'>('entries');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [config, setConfig] = useState<WaitlistConfig>({
    waitlistEnabled: false,
    waitlistMessage: '',
    autoInviteEnabled: false,
    dailyInviteQuota: 10,
    inviteTime: '09:00',
    masterReferralCode: '',
    masterReferralCredits: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWaitlistData();
  }, [appId]);

  const fetchWaitlistData = async () => {
    try {
      // Fetch waitlist entries
      const entriesRes = await fetch(`/api/v1/admin/waitlist?appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.data.entries || []);
      }

      // Fetch app configuration
      const configRes = await fetch(`/api/v1/admin/app/${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (configRes.ok) {
        const data = await configRes.json();
        const app = data.data.app;
        setConfig({
          waitlistEnabled: app.waitlistEnabled,
          waitlistMessage: app.waitlistMessage || '',
          autoInviteEnabled: app.autoInviteEnabled,
          dailyInviteQuota: app.dailyInviteQuota,
          inviteTime: app.inviteTime,
          masterReferralCode: app.masterReferralCode || '',
          masterReferralCredits: app.masterReferralCredits,
        });
      }
    } catch (error) {
      console.error('Error fetching waitlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/admin/app`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          id: appId,
          ...config,
        }),
      });

      if (response.ok) {
        alert('Waitlist configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteSelected = async () => {
    if (selectedEntries.size === 0) {
      alert('Please select users to invite');
      return;
    }

    try {
      const response = await fetch('/api/v1/admin/invite-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          appId,
          waitlistIds: Array.from(selectedEntries),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully invited ${data.data.invited} users!`);
        fetchWaitlistData();
        setSelectedEntries(new Set());
      } else {
        alert('Failed to send invitations');
      }
    } catch (error) {
      console.error('Error inviting users:', error);
      alert('Failed to send invitations');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      INVITED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  const content = (
    <div className={embedded ? "" : "bg-white rounded-lg shadow-xl max-w-6xl w-full overflow-hidden"}>
        {!embedded && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Waitlist Management - {appName}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
          </div>
        )}
        <div className={embedded ? "border-b border-gray-200" : "px-6 py-4 border-b border-gray-200"}>
          <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Waitlist Entries
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
          </nav>
        </div>

        <div className={embedded ? "" : "overflow-y-auto"} style={embedded ? {} : { maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'entries' ? (
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Total: {entries.length} | 
                    Waiting: {entries.filter(e => e.status === 'WAITING').length} | 
                    Invited: {entries.filter(e => e.status === 'INVITED').length} | 
                    Accepted: {entries.filter(e => e.status === 'ACCEPTED').length}
                  </span>
                </div>
                <button
                  onClick={handleInviteSelected}
                  disabled={selectedEntries.size === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Invite Selected ({selectedEntries.size})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              const waitingIds = entries
                                .filter(e => e.status === 'WAITING')
                                .map(e => e.id);
                              setSelectedEntries(new Set(waitingIds));
                            } else {
                              setSelectedEntries(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Invited
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Accepted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEntries.has(entry.id)}
                            disabled={entry.status !== 'WAITING'}
                            onChange={(e) => {
                              const newSelected = new Set(selectedEntries);
                              if (e.target.checked) {
                                newSelected.add(entry.id);
                              } else {
                                newSelected.delete(entry.id);
                              }
                              setSelectedEntries(newSelected);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.position || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.email}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(entry.invitedAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(entry.acceptedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Waitlist Configuration</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="waitlistEnabled"
                      checked={config.waitlistEnabled}
                      onChange={(e) => setConfig({ ...config, waitlistEnabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="waitlistEnabled" className="ml-2 text-sm text-gray-900">
                      Enable Waitlist
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Waitlist Message (optional)
                    </label>
                    <textarea
                      value={config.waitlistMessage || ''}
                      onChange={(e) => setConfig({ ...config, waitlistMessage: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Join our exclusive waitlist to get early access..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Master Referral Code
                    </label>
                    <input
                      type="text"
                      value={config.masterReferralCode || ''}
                      onChange={(e) => setConfig({ ...config, masterReferralCode: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="EARLYBIRD"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Special code used in invitation emails to bypass waitlist
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Master Referral Credits
                    </label>
                    <input
                      type="number"
                      value={config.masterReferralCredits}
                      onChange={(e) => setConfig({ ...config, masterReferralCredits: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Auto-Invitation Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoInviteEnabled"
                      checked={config.autoInviteEnabled}
                      onChange={(e) => setConfig({ ...config, autoInviteEnabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoInviteEnabled" className="ml-2 text-sm text-gray-900">
                      Enable Auto-Invitations
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Daily Invite Quota
                    </label>
                    <input
                      type="number"
                      value={config.dailyInviteQuota}
                      onChange={(e) => setConfig({ ...config, dailyInviteQuota: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Invitation Time (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={config.inviteTime}
                      onChange={(e) => setConfig({ ...config, inviteTime: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      {content}
    </div>
  );
}
