'use client';

import { useState, useEffect } from 'react';

interface InvitationMetrics {
  totalInvitations: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  redemptionRate: number;
  avgTimeToRedeem: string;
  invitationsByStatus: {
    pending: number;
    sent: number;
    opened: number;
    clicked: number;
    redeemed: number;
    expired: number;
  };
  recentInvitations: Array<{
    id: string;
    email: string;
    code: string;
    status: string;
    sentAt: string;
    redeemedAt?: string;
    expiresAt: string;
    useCount: number;
    maxUses: number;
  }>;
}

export default function InvitationTracker({ appId }: { appId: string }) {
  const [metrics, setMetrics] = useState<InvitationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    expiresInDays: 7,
    maxUses: 1,
    customMessage: '',
  });
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    link: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [appId, selectedPeriod]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/waitlist/invitations?appId=${appId}&period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching invitation metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!newInvite.email) {
      alert('Please enter an email address');
      return;
    }

    setGeneratingCode(true);
    try {
      const response = await fetch('/api/v1/admin/waitlist/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          appId,
          ...newInvite,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode({
          code: data.data.code,
          link: `${window.location.origin}/waitlist/redeem/${data.data.code}`,
          expiresAt: data.data.expiresAt,
        });
        fetchMetrics(); // Refresh metrics
      } else {
        alert('Failed to generate invitation code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Failed to generate invitation code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading invitation metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Invitation Tracking</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={() => setShowCodeGenerator(!showCodeGenerator)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Generate Invitation
          </button>
        </div>
      </div>

      {/* Code Generator Panel */}
      {showCodeGenerator && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Generate Invitation Code</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires In (days)
              </label>
              <input
                type="number"
                value={newInvite.expiresInDays}
                onChange={(e) => setNewInvite({ ...newInvite, expiresInDays: parseInt(e.target.value) || 7 })}
                min="1"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses
              </label>
              <input
                type="number"
                value={newInvite.maxUses}
                onChange={(e) => setNewInvite({ ...newInvite, maxUses: parseInt(e.target.value) || 1 })}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message (optional)
              </label>
              <input
                type="text"
                value={newInvite.customMessage}
                onChange={(e) => setNewInvite({ ...newInvite, customMessage: e.target.value })}
                placeholder="Welcome to our exclusive beta!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {generatingCode ? 'Generating...' : 'Generate Code'}
            </button>
            
            {generatedCode && (
              <div className="flex-1 bg-white p-3 rounded border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Code: {generatedCode.code}</p>
                    <p className="text-xs text-gray-500">Expires: {new Date(generatedCode.expiresAt).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(generatedCode.code)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Copy Code
                    </button>
                    <button
                      onClick={() => copyToClipboard(generatedCode.link)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Sent</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics?.totalInvitations || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Sent Today</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics?.sentToday || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500">This Week</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics?.sentThisWeek || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500">This Month</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics?.sentThisMonth || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Redemption Rate</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics?.redemptionRate || 0}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Avg Time to Redeem</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{metrics?.avgTimeToRedeem || 'N/A'}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      {metrics?.invitationsByStatus && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Invitation Status Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(metrics.invitationsByStatus).map(([status, count]) => (
              <div key={status}>
                <p className="text-xs text-gray-500 capitalize">{status}</p>
                <p className="text-lg font-semibold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invitations Table */}
      {metrics?.recentInvitations && metrics.recentInvitations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Recent Invitations</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.recentInvitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{inv.email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{inv.code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        inv.status === 'redeemed' ? 'bg-green-100 text-green-800' :
                        inv.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {inv.useCount} / {inv.maxUses}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(inv.sentAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => copyToClipboard(inv.code)}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
