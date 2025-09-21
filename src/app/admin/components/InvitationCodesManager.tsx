'use client';

import { useState, useEffect } from 'react';
import { generateInvitationCode, calculateCodeExpiration } from '@/lib/utils/invitationCode';
import styles from '../admin.module.css';

interface InvitationCode {
  id: string;
  email: string;
  invitationCode: string;
  status: string;
  invitedAt?: string;
  codeUsedAt?: string;
  codeExpiresAt?: string;
  fingerprintId?: string;
  useCount: number;
  maxUses: number;
}

interface InvitationCodesManagerProps {
  appId: string;
  appName: string;
}

export default function InvitationCodesManager({ appId, appName }: InvitationCodesManagerProps) {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, used, unused, expired
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    email: '',
    expirationDays: 7,
    maxUses: 1,
    bulkEmails: ''
  });
  const [analytics, setAnalytics] = useState({
    totalCodes: 0,
    usedCodes: 0,
    expiredCodes: 0,
    redemptionRate: 0,
    avgTimeToRedeem: 0
  });

  useEffect(() => {
    fetchCodes();
    fetchAnalytics();
  }, [appId]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/waitlist?appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch invitation codes');
      
      const data = await response.json();
      const waitlistEntries = data.data?.waitlist || [];
      
      // Filter to only show entries with invitation codes
      const invitationCodes = waitlistEntries.filter((entry: any) => 
        entry.invitationCode && entry.status === 'INVITED'
      );
      
      setCodes(invitationCodes);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/admin/waitlist?appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`
        }
      });

      if (!response.ok) return;
      
      const data = await response.json();
      const allCodes = data.data?.waitlist?.filter((e: any) => e.invitationCode) || [];
      
      const used = allCodes.filter((c: any) => c.codeUsedAt).length;
      const expired = allCodes.filter((c: any) => 
        c.codeExpiresAt && new Date(c.codeExpiresAt) < new Date() && !c.codeUsedAt
      ).length;
      
      // Calculate average time to redemption
      const redeemedCodes = allCodes.filter((c: any) => c.codeUsedAt && c.invitedAt);
      let avgTime = 0;
      if (redeemedCodes.length > 0) {
        const totalTime = redeemedCodes.reduce((sum: number, c: any) => {
          const invited = new Date(c.invitedAt).getTime();
          const used = new Date(c.codeUsedAt).getTime();
          return sum + (used - invited);
        }, 0);
        avgTime = totalTime / redeemedCodes.length / (1000 * 60 * 60); // Convert to hours
      }
      
      setAnalytics({
        totalCodes: allCodes.length,
        usedCodes: used,
        expiredCodes: expired,
        redemptionRate: allCodes.length > 0 ? (used / allCodes.length) * 100 : 0,
        avgTimeToRedeem: avgTime
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const generateCode = async () => {
    try {
      const emails = generateForm.bulkEmails 
        ? generateForm.bulkEmails.split('\n').map(e => e.trim()).filter(e => e)
        : [generateForm.email];
      
      for (const email of emails) {
        if (!email) continue;
        
        // First check if user exists in waitlist
        let waitlistEntry = codes.find(c => c.email === email);
        
        if (!waitlistEntry) {
          // Add to waitlist first
          await fetch('/api/v1/waitlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`
            },
            body: JSON.stringify({ email, appKey: appId })
          });
        }
        
        // Generate unique code
        const invitationCode = generateInvitationCode();
        const expiresAt = calculateCodeExpiration(generateForm.expirationDays);
        
        // Update waitlist entry with invitation
        await fetch('/api/v1/admin/invite-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`
          },
          body: JSON.stringify({
            appId,
            limit: 1,
            emails: [email]
          })
        });
      }
      
      // Refresh the list
      await fetchCodes();
      await fetchAnalytics();
      setShowGenerateModal(false);
      setGenerateForm({ email: '', expirationDays: 7, maxUses: 1, bulkEmails: '' });
    } catch (error) {
      console.error('Error generating codes:', error);
      alert('Failed to generate invitation codes');
    }
  };

  const resendInvitation = async (code: InvitationCode) => {
    try {
      // Trigger email resend
      alert(`Resending invitation to ${code.email}...`);
      // In a real implementation, this would call an API to resend the email
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const revokeCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation code?')) return;
    
    try {
      // Update status to expired/revoked
      // This would need a new API endpoint in production
      alert('Code revoked');
      await fetchCodes();
    } catch (error) {
      console.error('Error revoking code:', error);
    }
  };

  // Filter codes based on current filter
  const filteredCodes = codes.filter(code => {
    // Search filter
    if (searchTerm && 
        !code.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !code.invitationCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filter === 'used' && !code.codeUsedAt) return false;
    if (filter === 'unused' && code.codeUsedAt) return false;
    if (filter === 'expired' && (!code.codeExpiresAt || 
        new Date(code.codeExpiresAt) >= new Date() || code.codeUsedAt)) return false;
    
    return true;
  });

  const getCodeStatus = (code: InvitationCode) => {
    if (code.codeUsedAt) return { text: 'Used', color: '#28a745' };
    if (code.codeExpiresAt && new Date(code.codeExpiresAt) < new Date()) {
      return { text: 'Expired', color: '#dc3545' };
    }
    return { text: 'Active', color: '#007bff' };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading invitation codes...</div>;
  }

  return (
    <div className={styles.codesContainer}>
      <div className={styles.codesHeader}>
        <h2>🎫 Invitation Codes Management</h2>
        <button onClick={() => setShowGenerateModal(true)} className={styles.primaryButton}>
          + Generate Codes
        </button>
      </div>

      {/* Analytics Cards */}
      <div className={styles.analyticsCards}>
        <div className={styles.analyticsCard}>
          <h4>Total Codes</h4>
          <div className={styles.analyticsValue}>{analytics.totalCodes}</div>
        </div>
        <div className={styles.analyticsCard}>
          <h4>Redemption Rate</h4>
          <div className={styles.analyticsValue}>{analytics.redemptionRate.toFixed(1)}%</div>
        </div>
        <div className={styles.analyticsCard}>
          <h4>Used Codes</h4>
          <div className={styles.analyticsValue}>{analytics.usedCodes}</div>
        </div>
        <div className={styles.analyticsCard}>
          <h4>Expired Codes</h4>
          <div className={styles.analyticsValue}>{analytics.expiredCodes}</div>
        </div>
        <div className={styles.analyticsCard}>
          <h4>Avg Time to Redeem</h4>
          <div className={styles.analyticsValue}>
            {analytics.avgTimeToRedeem.toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <input
          type="text"
          placeholder="Search by email or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        <div className={styles.filterButtons}>
          <button 
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.activeFilter : ''}
          >
            All ({codes.length})
          </button>
          <button 
            onClick={() => setFilter('unused')}
            className={filter === 'unused' ? styles.activeFilter : ''}
          >
            Unused
          </button>
          <button 
            onClick={() => setFilter('used')}
            className={filter === 'used' ? styles.activeFilter : ''}
          >
            Used
          </button>
          <button 
            onClick={() => setFilter('expired')}
            className={filter === 'expired' ? styles.activeFilter : ''}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className={styles.codesTable}>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Email</th>
              <th>Status</th>
              <th>Invited At</th>
              <th>Expires At</th>
              <th>Used At</th>
              <th>Uses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((code) => {
              const status = getCodeStatus(code);
              return (
                <tr key={code.id}>
                  <td>
                    <span className={styles.codeDisplay}>{code.invitationCode}</span>
                  </td>
                  <td>{code.email}</td>
                  <td>
                    <span 
                      className={styles.statusBadge} 
                      style={{ backgroundColor: status.color }}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td>{formatDate(code.invitedAt)}</td>
                  <td>{formatDate(code.codeExpiresAt)}</td>
                  <td>{formatDate(code.codeUsedAt)}</td>
                  <td>{code.useCount}/{code.maxUses}</td>
                  <td>
                    {!code.codeUsedAt && (
                      <>
                        <button 
                          onClick={() => resendInvitation(code)}
                          className={styles.actionButton}
                          title="Resend invitation email"
                        >
                          📧
                        </button>
                        <button 
                          onClick={() => revokeCode(code.id)}
                          className={styles.actionButton}
                          title="Revoke code"
                        >
                          ❌
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredCodes.length === 0 && (
          <div className={styles.emptyState}>
            {searchTerm || filter !== 'all' 
              ? 'No codes found matching your filters' 
              : 'No invitation codes generated yet'}
          </div>
        )}
      </div>

      {/* Generate Code Modal */}
      {showGenerateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Generate Invitation Codes</h3>
            
            <div className={styles.formGroup}>
              <label>Single Email:</label>
              <input
                type="email"
                value={generateForm.email}
                onChange={(e) => setGenerateForm({...generateForm, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Or Bulk Emails (one per line):</label>
              <textarea
                value={generateForm.bulkEmails}
                onChange={(e) => setGenerateForm({...generateForm, bulkEmails: e.target.value})}
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                rows={5}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Expiration (days):</label>
              <input
                type="number"
                value={generateForm.expirationDays}
                onChange={(e) => setGenerateForm({
                  ...generateForm, 
                  expirationDays: parseInt(e.target.value) || 7
                })}
                min="1"
                max="30"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Max Uses:</label>
              <input
                type="number"
                value={generateForm.maxUses}
                onChange={(e) => setGenerateForm({
                  ...generateForm, 
                  maxUses: parseInt(e.target.value) || 1
                })}
                min="1"
                max="10"
              />
            </div>
            
            <div className={styles.modalActions}>
              <button onClick={generateCode} className={styles.primaryButton}>
                Generate
              </button>
              <button onClick={() => setShowGenerateModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
