'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, Send, X, RotateCw, Trash2, UserPlus, CheckCircle, Clock, XCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  inviter: {
    name: string;
    email: string;
  };
  organizationName: string;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  users: TeamMember[];
}

export default function TeamPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch full user data with organizations
      const userResponse = await fetch('/api/admin/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setOrganizations(userData.data.organizations || []);
        if (userData.data.organizations?.length > 0 && !selectedOrgId) {
          setSelectedOrgId(userData.data.organizations[0].id);
        }
      }
      
      // Fetch invitations
      const invitesResponse = await fetch('/api/admin/invitations');
      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json();
        setInvitations(invitesData.data.invitations || []);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedOrgId) return;
    
    setError('');
    setSuccess('');
    setInviting(true);
    
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail.trim(),
          organizationId: selectedOrgId
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        fetchTeamData();
      } else {
        setError(data.error?.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An error occurred while sending invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setSuccess('Invitation resent successfully');
        fetchTeamData();
      } else {
        setError('Failed to resend invitation');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess('Invitation revoked');
        fetchTeamData();
      } else {
        setError('Failed to revoke invitation');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member? They will lose access to all apps in this organization.')) return;
    
    setRemovingUserId(userId);
    try {
      const response = await fetch(`/api/admin/team/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selectedOrgId }),
      });
      
      if (response.ok) {
        setSuccess('Team member removed');
        fetchTeamData();
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to remove team member');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setRemovingUserId(null);
    }
  };

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);
  const orgInvitations = invitations.filter(inv => inv.organizationId === selectedOrgId && inv.status === 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8" style={{ color: '#10b981' }} />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Management</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your team members and invite new people to collaborate
          </p>
        </div>

        {/* Organization Selector */}
        {organizations.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-emerald-800 dark:text-emerald-200">{success}</p>
          </div>
        )}

        {/* Invite Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Invite Team Member</h2>
          </div>
          
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={inviting || !selectedOrgId}
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim() || !selectedOrgId}
              className="px-6 py-2 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: inviting ? '#6b7280' : 'linear-gradient(to right, #10b981, #14b8a6)'
              }}
            >
              <Send className="w-4 h-4" />
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Team Members</h2>
              <span className="ml-auto text-sm text-slate-500">
                {selectedOrg?.users.length || 0} members
              </span>
            </div>
            
            <div className="space-y-3">
              {selectedOrg?.users.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingUserId === member.id}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove member"
                  >
                    {removingUserId === member.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
              
              {(!selectedOrg || selectedOrg.users.length === 0) && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No team members yet
                </p>
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Pending Invitations</h2>
              <span className="ml-auto text-sm text-slate-500">
                {orgInvitations.length} pending
              </span>
            </div>
            
            <div className="space-y-3">
              {orgInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{invitation.email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleResend(invitation.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition-colors"
                        title="Resend invitation"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevoke(invitation.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Revoke invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {orgInvitations.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No pending invitations
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

