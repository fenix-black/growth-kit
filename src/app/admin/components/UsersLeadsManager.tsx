'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Mail,
  CheckCircle,
  XCircle,
  Coins,
  Share2,
  Calendar,
  Eye,
  Plus,
  Download,
  Filter,
  ArrowUpDown,
  Trash2,
  User,
  Fingerprint,
  MapPin
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/components/ui/utils';
import { AdminUnifiedTimeline } from './AdminUnifiedTimeline';
import { UserActivityAnalytics } from './UserActivityAnalytics';
import { UserActivityHistory } from './UserActivityHistory';
import { LanguageIndicator } from '@/components/ui/LanguageIndicator';
import { ReferralIndicator } from '@/components/ui/ReferralIndicator';
import { formatLocationForDisplay, formatLocationForCSV } from '@/lib/utils/location';

interface User {
  id: string;
  fingerprintId: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  creditBalance: number;
  referralCount: number;
  referralSource: {
    referralId: string;
    referredAt: string | null;
    referrer: {
      id: string;
      fingerprintId: string;
      name: string | null;
      email: string | null;
    } | null;
  } | null;
  lastActiveAt: string;
  createdAt: string;
  referralCode: string;
  browser: string | null;
  device: string | null;
  location: { city: string | null; country: string | null; region: string | null } | null;
  // Language information
  browserLanguage: string | null;
  preferredLanguage: string | null;
  languageSource: string | null;
  languageUpdatedAt: string | null;
}

interface UserDetails extends User {
  lastDailyGrant: string | null;
  leads: Array<{
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: boolean;
    createdAt: string;
  }>;
  creditHistory: Array<{
    id: string;
    amount: number;
    reason: string;
    metadata: any;
    createdAt: string;
  }>;
  recentUsage: Array<{
    id: string;
    action: string;
    usdValue: string | null;
    createdAt: string;
  }>;
  referredUsers: Array<{
    id: string;
    fingerprintId: string | null;
    email: string | null;
    name: string | null;
    claimedAt: string | null;
    visitCount: number;
  }>;
  referredBy: {
    id: string;
    fingerprintId: string | null;
    email: string | null;
    name: string | null;
    claimedAt: string | null;
  } | null;
  stats: {
    totalCreditsEarned: number;
    totalCreditsSpent: number;
    totalReferrals: number;
    totalActions: number;
  };
}

interface UsersLeadsManagerProps {
  appId: string;
  appName: string;
  appDomain: string;
  app?: any; // App object with publicKey
  embedded?: boolean;
  onClose?: () => void;
}

export default function UsersLeadsManager({
  appId,
  appName,
  appDomain,
  app,
  embedded = false,
  onClose,
}: UsersLeadsManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('lastActiveAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState({ amount: 0, reason: '' });
  const [adjustingCredits, setAdjustingCredits] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'activities' | 'timeline'>('overview');

  // Filters
  const [minCredits, setMinCredits] = useState('');
  const [maxCredits, setMaxCredits] = useState('');
  const [minReferrals, setMinReferrals] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search, sortBy, sortOrder, verifiedOnly, minCredits, maxCredits, minReferrals]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
        sortBy,
        sortOrder,
        verifiedOnly: verifiedOnly.toString(),
      });

      if (minCredits) params.append('minCredits', minCredits);
      if (maxCredits) params.append('maxCredits', maxCredits);
      if (minReferrals) params.append('minReferrals', minReferrals);

      const response = await fetch(`/api/v1/admin/app/${appId}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (fingerprintId: string) => {
    try {
      setUserDetailsLoading(true);
      const response = await fetch(`/api/v1/admin/app/${appId}/users/${fingerprintId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.data.user);
      }
    } catch (error) {
      // Handle error
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !creditAdjustment.amount || !creditAdjustment.reason) return;

    try {
      setAdjustingCredits(true);
      const response = await fetch(
        `/api/v1/admin/app/${appId}/users/${selectedUser.id}/credits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
          },
          body: JSON.stringify({
            amount: creditAdjustment.amount,
            reason: creditAdjustment.reason,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update selected user with new balance
        setSelectedUser({
          ...selectedUser,
          creditBalance: data.data.newBalance,
        });
        // Reset form
        setCreditAdjustment({ amount: 0, reason: '' });
        // Refresh user list
        fetchUsers();
      }
    } catch (error) {
      // Handle error
    } finally {
      setAdjustingCredits(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will permanently delete all their data including leads, credits, and referrals.')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      const response = await fetch(
        `/api/v1/admin/app/${appId}/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
          },
        }
      );

      if (response.ok) {
        // Close detail modal if open
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
        // Refresh user list
        fetchUsers();
      }
    } catch (error) {
      // Handle error
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // For today, show relative time
    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return 'Just now';
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    // For other days, show readable date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const exportToCSV = () => {
    const headers = ['Fingerprint ID', 'Name', 'Email', 'Verified', 'Browser', 'Device', 'Location', 'Language', 'Credits', 'Referrals', 'Last Active', 'Created'];
    const rows = users.map(user => [
      user.fingerprintId,
      user.name || '',
      user.email || '',
      user.emailVerified ? 'Yes' : 'No',
      user.browser || '',
      user.device || '',
      formatLocationForCSV(user.location),
      user.preferredLanguage || user.browserLanguage || 'N/A',
      user.creditBalance.toString(),
      user.referralCount.toString(),
      new Date(user.lastActiveAt).toLocaleDateString(),
      new Date(user.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName}-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg', embedded ? '' : 'shadow-lg')}>
      {!embedded && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users & Leads</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XCircle size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by fingerprint, email, or name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <Button
              variant="ghost"
              icon={<Filter size={20} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="ghost"
              icon={<Download size={20} />}
              onClick={exportToCSV}
            >
              Export
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Verified Only</span>
                </label>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Min Credits</label>
                  <input
                    type="number"
                    value={minCredits}
                    onChange={(e) => setMinCredits(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Max Credits</label>
                  <input
                    type="number"
                    value={maxCredits}
                    onChange={(e) => setMaxCredits(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Min Referrals</label>
                  <input
                    type="number"
                    value={minReferrals}
                    onChange={(e) => setMinReferrals(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Language
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('credits')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Credits</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('referrals')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Referrals</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastActiveAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Active</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const displayName = user.name || `fp_${user.fingerprintId.substring(0, 8)}`;
                  // User is "Active" if they were active within the last 5 minutes
                  const isActive = new Date(user.lastActiveAt).getTime() > Date.now() - 5 * 60 * 1000;
                  
                  return (
                  <tr 
                    key={user.id} 
                    className={cn(
                      isActive 
                        ? "bg-green-50/50 hover:bg-green-100/50 dark:bg-green-900/10 dark:hover:bg-green-900/20" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Fingerprint className="w-10 h-10 text-teal-500" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-white">
                            <span>{displayName}</span>
                            {user.referralSource && (
                              <ReferralIndicator referralSource={user.referralSource} />
                            )}
                          </div>
                          {user.browser && user.device && (
                            <div className="text-xs text-gray-500">
                              {user.browser} • {user.device}
                            </div>
                          )}
                          {user.email && (
                            <div className="flex items-center space-x-1">
                              <Mail size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">{user.email}</span>
                              {user.emailVerified && (
                                <CheckCircle size={12} className="text-green-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {(() => {
                        const formattedLocation = formatLocationForDisplay(user.location);
                        return formattedLocation ? (
                          <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-white">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{formattedLocation}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4">
                      <LanguageIndicator
                        preferredLanguage={user.preferredLanguage}
                        browserLanguage={user.browserLanguage}
                        languageSource={user.languageSource}
                        showTooltip={true}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Coins size={16} className="text-yellow-500" />
                        <span className={cn(
                          'text-sm font-medium',
                          user.creditBalance > 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'
                        )}>
                          {user.creditBalance}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Share2 size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user.referralCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatLastActive(user.lastActiveAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={16} />}
                          onClick={() => fetchUserDetails(user.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDeleteUser(user.id)}
                          loading={deletingUserId === user.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {userDetailsLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Loading user details...
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                          'py-2 px-1 border-b-2 font-medium text-sm',
                          activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className={cn(
                          'py-2 px-1 border-b-2 font-medium text-sm',
                          activeTab === 'analytics'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                      >
                        Analytics
                      </button>
                      <button
                        onClick={() => setActiveTab('activities')}
                        className={cn(
                          'py-2 px-1 border-b-2 font-medium text-sm',
                          activeTab === 'activities'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                      >
                        Activity History
                      </button>
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className={cn(
                          'py-2 px-1 border-b-2 font-medium text-sm',
                          activeTab === 'timeline'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                      >
                        Timeline
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">User Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Fingerprint:</span>
                        <p className="font-mono text-xs mt-1">{selectedUser.fingerprintId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Referral Code:</span>
                        <p className="font-mono mt-1">{selectedUser.referralCode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Created:</span>
                        <p className="mt-1">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Active:</span>
                        <p className="mt-1">{new Date(selectedUser.lastActiveAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Language Information */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                      <span>🌐</span>
                      <span>Language Information</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Preferred Language:</span>
                        <div className="mt-1">
                          <LanguageIndicator
                            preferredLanguage={selectedUser.preferredLanguage}
                            className="justify-start"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Browser Language:</span>
                        <p className="mt-1 font-mono text-xs">{selectedUser.browserLanguage || 'Not detected'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Detection Method:</span>
                        <p className="mt-1 capitalize">
                          {selectedUser.languageSource?.replace('_', ' ') || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                        <p className="mt-1">
                          {selectedUser.languageUpdatedAt 
                            ? new Date(selectedUser.languageUpdatedAt).toLocaleString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedUser.creditBalance}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedUser.stats.totalCreditsEarned}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {selectedUser.stats.totalCreditsSpent}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedUser.stats.totalReferrals}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Referrals</p>
                    </div>
                  </div>
                  
                  {/* Show USD stats if available */}
                  {selectedUser.recentUsage.some(u => u.usdValue) && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                        ${selectedUser.recentUsage
                          .filter(u => u.usdValue)
                          .reduce((sum, u) => sum + parseFloat(u.usdValue!), 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total USD Cost</p>
                    </div>
                  )}

                  {/* Email/Lead History */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Email History</h4>
                    <div className="space-y-2">
                      {selectedUser.leads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{lead.email}</p>
                            {lead.name && <p className="text-xs text-gray-500">{lead.name}</p>}
                          </div>
                          <div className="flex items-center space-x-2">
                            {lead.emailVerified ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : (
                              <XCircle size={16} className="text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Credit Adjustment */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Adjust Credits</h4>
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                        <input
                          type="number"
                          value={creditAdjustment.amount}
                          onChange={(e) => setCreditAdjustment({ ...creditAdjustment, amount: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="e.g., 10 or -5"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Reason</label>
                        <input
                          type="text"
                          value={creditAdjustment.reason}
                          onChange={(e) => setCreditAdjustment({ ...creditAdjustment, reason: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="e.g., Manual adjustment"
                        />
                      </div>
                      <Button
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={handleAdjustCredits}
                        loading={adjustingCredits}
                        disabled={!creditAdjustment.amount || !creditAdjustment.reason}
                      >
                        Adjust
                      </Button>
                    </div>
                  </div>

                  {/* Recent Usage History */}
                  {selectedUser.recentUsage.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Actions</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">USD Cost</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {selectedUser.recentUsage.slice(0, 10).map((usage) => (
                              <tr key={usage.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{usage.action}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {usage.usdValue ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      ${parseFloat(usage.usdValue).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                  {new Date(usage.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Recent Credit History */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Credit History</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.creditHistory.map((credit) => (
                        <div key={credit.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div>
                            <p className="text-sm">{credit.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(credit.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={cn(
                            'text-sm font-medium',
                            credit.amount > 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {credit.amount > 0 ? '+' : ''}{credit.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>


                  {/* Referred Users */}
                  {selectedUser.referredUsers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Referred Users</h4>
                      <div className="space-y-2">
                        {selectedUser.referredUsers.map((referred) => (
                          <div key={referred.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{referred.email || 'Anonymous'}</p>
                              {referred.name && <p className="text-xs text-gray-500">{referred.name}</p>}
                            </div>
                            <span className="text-xs text-gray-500">
                              {referred.claimedAt && new Date(referred.claimedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      <UserActivityAnalytics 
                        appId={appId} 
                        fingerprintId={selectedUser.fingerprintId}
                      />
                    )}

                    {activeTab === 'activities' && (
                      <UserActivityHistory 
                        appId={appId} 
                        fingerprintId={selectedUser.fingerprintId}
                      />
                    )}

                    {activeTab === 'timeline' && (
                      <div className="space-y-4">
                        <AdminUnifiedTimeline 
                          appId={appId} 
                          fingerprintId={selectedUser.fingerprintId}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
