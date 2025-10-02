'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import ContentCard from '@/components/ui/ContentCard';
import StatsCard from '@/components/ui/StatsCard';
import { ArrowLeft, Users, Mail, Download, BarChart3, Settings as SettingsIcon, TrendingUp } from 'lucide-react';
import { ProductWaitlistConfig, ProductAnalytics } from '@/lib/types/product-waitlist';

interface WaitlistEntry {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  invitedAt: string | null;
  metadata: any;
}

interface ProductWithCounts extends ProductWaitlistConfig {
  _count: {
    total: number;
    waiting: number;
    invited: number;
    accepted: number;
  };
}

interface ProductWaitlistDetailProps {
  appId: string;
  product: ProductWithCounts;
  onBack: () => void;
}

export default function ProductWaitlistDetail({ appId, product, onBack }: ProductWaitlistDetailProps) {
  const [activeView, setActiveView] = useState<'entries' | 'analytics'>('entries');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');

  useEffect(() => {
    if (activeView === 'entries') {
      fetchEntries();
    } else {
      fetchAnalytics();
    }
  }, [activeView, product.tag]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/waitlist?appId=${appId}&productTag=${product.tag}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/app/${appId}/products/${product.tag}/analytics`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV
    const headers = ['Email', 'Status', 'Joined', 'Invited', 'Product'];
    const rows = entries.map(entry => [
      entry.email,
      entry.status,
      new Date(entry.createdAt).toLocaleDateString(),
      entry.invitedAt ? new Date(entry.invitedAt).toLocaleDateString() : '',
      product.name,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.tag}-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleEntrySelection = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)));
    }
  };

  // Chart data
  const getChartData = () => {
    if (!analytics) return null;

    const dates = Object.keys(analytics.timeline).sort();
    const counts = dates.map(date => analytics.timeline[date]);

    return {
      labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Signups',
          data: counts,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={<ArrowLeft size={16} />}
            onClick={onBack}
          >
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600">Product Waitlist Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveView('entries')}
            className={activeView === 'entries' ? 'bg-primary/10 text-primary' : ''}
          >
            Entries
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveView('analytics')}
            className={activeView === 'analytics' ? 'bg-primary/10 text-primary' : ''}
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total"
          value={product._count.total.toString()}
          icon={<Users />}
          color="primary"
        />
        <StatsCard
          title="Waiting"
          value={product._count.waiting.toString()}
          icon={<Users />}
          color="secondary"
        />
        <StatsCard
          title="Invited"
          value={product._count.invited.toString()}
          icon={<Mail />}
          color="orange"
        />
        <StatsCard
          title="Accepted"
          value={product._count.accepted.toString()}
          icon={<Users />}
          color="primary"
        />
      </div>

      {/* Analytics View */}
      {activeView === 'analytics' && analytics && (
        <div className="space-y-6">
          <ContentCard>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-gray-900">Signups Over Time (Last 30 Days)</h4>
            </div>

            {analytics.timeline && Object.keys(analytics.timeline).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analytics.timeline)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 10)
                  .map(([date, count]) => {
                    const maxCount = Math.max(...Object.values(analytics.timeline));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={date} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-gray-600">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            {count > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </ContentCard>

          <ContentCard>
            <h4 className="font-semibold text-gray-900 mb-4">Conversion Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Invited → Accepted Rate</span>
                <span className="font-semibold text-gray-900">
                  {(analytics.conversionRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.conversionRate * 100}%` }}
                />
              </div>
            </div>
          </ContentCard>
        </div>
      )}

      {/* Entries View */}
      {activeView === 'entries' && (
        <ContentCard>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Waitlist Entries</h4>
            <div className="flex gap-2">
              {selectedEntries.size > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Mail size={14} />}
                >
                  Invite Selected ({selectedEntries.size})
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No entries yet. Share your product waitlist to start collecting signups!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        checked={selectedEntries.size === entries.length && entries.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Email</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Joined</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Invited</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => toggleEntrySelection(entry.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                      </td>
                      <td className="p-3 text-sm text-gray-900">{entry.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                          entry.status === 'ACCEPTED' 
                            ? 'bg-primary/10 text-primary'
                            : entry.status === 'INVITED'
                            ? 'bg-fenix-orange/10 text-fenix-orange'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {entry.invitedAt ? new Date(entry.invitedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 text-right">
                        {entry.status === 'WAITING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Mail size={14} />}
                          >
                            Invite
                          </Button>
                        )}
                        {entry.status === 'INVITED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Mail size={14} />}
                          >
                            Resend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>
      )}
    </div>
  );
}

