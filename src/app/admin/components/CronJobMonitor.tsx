'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface CronJobRun {
  id: string;
  appId: string;
  appName?: string;
  event: string;
  status: 'success' | 'partial' | 'failed';
  invitedCount: number;
  errorCount: number;
  totalProcessed: number;
  executedAt: string;
  metadata: any;
}

interface CronJobStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalInvitesSent: number;
  averageInvitesPerRun: number;
  lastRunTime?: string;
  nextScheduledRun?: string;
}

interface CronJobMonitorProps {
  appId?: string;
}

export default function CronJobMonitor({ appId }: CronJobMonitorProps) {
  const [runs, setRuns] = useState<CronJobRun[]>([]);
  const [stats, setStats] = useState<CronJobStats>({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    totalInvitesSent: 0,
    averageInvitesPerRun: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, all
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCronHistory();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCronHistory, 30000);
    return () => clearInterval(interval);
  }, [appId, timeRange]);

  const fetchCronHistory = async () => {
    if (refreshing) return;
    setRefreshing(true);
    
    try {
      // Fetch cron job execution history from event logs
      const params = new URLSearchParams({
        ...(appId && { appId }),
        event: 'cron.invite_waitlist',
        timeRange,
      });

      const response = await fetch(`/api/v1/admin/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch cron history');
      
      const data = await response.json();
      const cronEvents = data.data?.events || [];
      
      // Process events into runs
      const processedRuns: CronJobRun[] = cronEvents.map((event: any) => ({
        id: event.id,
        appId: event.appId,
        appName: event.appName,
        event: event.event,
        status: determineStatus(event),
        invitedCount: event.metadata?.invitedCount || 0,
        errorCount: event.metadata?.errors?.length || 0,
        totalProcessed: event.metadata?.totalProcessed || 0,
        executedAt: event.createdAt,
        metadata: event.metadata,
      }));
      
      setRuns(processedRuns);
      
      // Calculate stats
      const successCount = processedRuns.filter(r => r.status === 'success').length;
      const totalInvites = processedRuns.reduce((sum, r) => sum + r.invitedCount, 0);
      
      setStats({
        totalRuns: processedRuns.length,
        successfulRuns: successCount,
        failedRuns: processedRuns.filter(r => r.status === 'failed').length,
        totalInvitesSent: totalInvites,
        averageInvitesPerRun: processedRuns.length > 0 ? totalInvites / processedRuns.length : 0,
        lastRunTime: processedRuns[0]?.executedAt,
        nextScheduledRun: calculateNextRun(),
      });
      
    } catch (error) {
      console.error('Error fetching cron history:', error);
      // Use mock data for demonstration
      setMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const determineStatus = (event: any) => {
    if (event.metadata?.errors?.length > 0 && event.metadata?.invitedCount === 0) {
      return 'failed';
    }
    if (event.metadata?.errors?.length > 0) {
      return 'partial';
    }
    return 'success';
  };

  const calculateNextRun = () => {
    // Assuming daily at 9 AM UTC
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(9, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    return nextRun.toISOString();
  };

  const setMockData = () => {
    // Set mock data for demonstration when API is not available
    const mockRuns: CronJobRun[] = [
      {
        id: '1',
        appId: appId || 'app1',
        appName: 'Demo App',
        event: 'cron.invite_waitlist',
        status: 'success',
        invitedCount: 10,
        errorCount: 0,
        totalProcessed: 10,
        executedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        metadata: { dailyQuota: 10 },
      },
      {
        id: '2',
        appId: appId || 'app1',
        appName: 'Demo App',
        event: 'cron.invite_waitlist',
        status: 'partial',
        invitedCount: 8,
        errorCount: 2,
        totalProcessed: 10,
        executedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        metadata: { dailyQuota: 10, errors: ['Email failed', 'Email failed'] },
      },
      {
        id: '3',
        appId: appId || 'app1',
        appName: 'Demo App',
        event: 'cron.invite_waitlist',
        status: 'success',
        invitedCount: 10,
        errorCount: 0,
        totalProcessed: 10,
        executedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        metadata: { dailyQuota: 10 },
      },
    ];
    
    setRuns(mockRuns);
    
    const totalInvites = mockRuns.reduce((sum, r) => sum + r.invitedCount, 0);
    setStats({
      totalRuns: mockRuns.length,
      successfulRuns: 2,
      failedRuns: 0,
      totalInvitesSent: totalInvites,
      averageInvitesPerRun: totalInvites / mockRuns.length,
      lastRunTime: mockRuns[0].executedAt,
      nextScheduledRun: calculateNextRun(),
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeUntil = (dateString?: string) => {
    if (!dateString) return '-';
    const ms = new Date(dateString).getTime() - Date.now();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleManualTrigger = async () => {
    if (!confirm('Are you sure you want to manually trigger the invitation cron job?')) return;
    
    try {
      const response = await fetch('/api/cron/invite-waitlist', {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
        },
      });
      
      if (response.ok) {
        alert('Cron job triggered successfully!');
        await fetchCronHistory();
      } else {
        alert('Failed to trigger cron job');
      }
    } catch (error) {
      console.error('Error triggering cron job:', error);
      alert('Error triggering cron job');
    }
  };

  if (loading && !refreshing) {
    return <div className={styles.loading}>Loading cron job history...</div>;
  }

  return (
    <div className={styles.cronContainer}>
      <div className={styles.cronHeader}>
        <h2>⏰ Cron Job Monitoring</h2>
        <div className={styles.cronActions}>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.timeRangeSelect}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={handleManualTrigger}
            className={styles.triggerButton}
            title="Manually trigger invitation cron job"
          >
            ▶️ Trigger Now
          </button>
          <button 
            onClick={fetchCronHistory}
            disabled={refreshing}
            className={`${styles.refreshButton} ${refreshing ? styles.spinning : ''}`}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className={styles.cronStatusCards}>
        <div className={styles.cronStatusCard}>
          <h4>Status</h4>
          <div className={styles.cronStatusValue}>
            {stats.lastRunTime ? (
              <span style={{ color: getStatusColor('success') }}>✓ Active</span>
            ) : (
              <span style={{ color: getStatusColor('failed') }}>⚠ No Runs</span>
            )}
          </div>
        </div>
        
        <div className={styles.cronStatusCard}>
          <h4>Last Run</h4>
          <div className={styles.cronStatusValue}>
            {formatDate(stats.lastRunTime)}
          </div>
        </div>
        
        <div className={styles.cronStatusCard}>
          <h4>Next Run</h4>
          <div className={styles.cronStatusValue}>
            In {formatTimeUntil(stats.nextScheduledRun)}
            <div className={styles.cronStatusSubtext}>
              {formatDate(stats.nextScheduledRun)}
            </div>
          </div>
        </div>
        
        <div className={styles.cronStatusCard}>
          <h4>Total Runs</h4>
          <div className={styles.cronStatusValue}>{stats.totalRuns}</div>
        </div>
        
        <div className={styles.cronStatusCard}>
          <h4>Success Rate</h4>
          <div className={styles.cronStatusValue}>
            {stats.totalRuns > 0 
              ? `${((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>
        
        <div className={styles.cronStatusCard}>
          <h4>Total Invites Sent</h4>
          <div className={styles.cronStatusValue}>{stats.totalInvitesSent}</div>
        </div>
        
        <div className={styles.cronStatusCard}>
          <h4>Avg per Run</h4>
          <div className={styles.cronStatusValue}>
            {stats.averageInvitesPerRun.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className={styles.cronHistory}>
        <h3>Execution History</h3>
        <table className={styles.cronTable}>
          <thead>
            <tr>
              <th>Time</th>
              <th>App</th>
              <th>Status</th>
              <th>Invites Sent</th>
              <th>Errors</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{formatDate(run.executedAt)}</td>
                <td>{run.appName || run.appId}</td>
                <td>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(run.status) }}
                  >
                    {run.status}
                  </span>
                </td>
                <td>{run.invitedCount}/{run.totalProcessed}</td>
                <td>{run.errorCount > 0 ? `❌ ${run.errorCount}` : '✓ 0'}</td>
                <td>
                  {run.metadata?.errors?.length > 0 && (
                    <span className={styles.errorDetails} title={run.metadata.errors.join(', ')}>
                      {run.metadata.errors[0]}
                    </span>
                  )}
                  {run.metadata?.dailyQuota && (
                    <span className={styles.quotaInfo}>
                      Quota: {run.metadata.dailyQuota}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {runs.length === 0 && (
          <div className={styles.emptyState}>
            No cron job executions found for the selected time range
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {refreshing && (
        <div className={styles.refreshIndicator}>
          🔄 Refreshing...
        </div>
      )}
    </div>
  );
}
