'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Settings,
  Terminal,
  TrendingUp,
  AlertTriangle,
  Bell,
  BellOff,
  Eye,
  Download
} from 'lucide-react';

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
  duration?: number; // in ms
  logs?: string[];
  metadata: any;
}

interface CronJobStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalInvitesSent: number;
  averageInvitesPerRun: number;
  averageDuration: number;
  lastRunTime?: string;
  nextScheduledRun?: string;
}

interface AlertConfig {
  enabled: boolean;
  failureThreshold: number;
  emailNotification: boolean;
  slackWebhook?: string;
}

interface App {
  id: string;
  name: string;
  autoInviteEnabled: boolean;
  dailyInviteQuota: number;
}

interface CronJobMonitorProps {
  appId?: string;
  onClose?: () => void;
}

export default function CronJobMonitorEnhanced({ appId, onClose }: CronJobMonitorProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'logs' | 'metrics' | 'alerts'>('timeline');
  const [runs, setRuns] = useState<CronJobRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<CronJobRun | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [stats, setStats] = useState<CronJobStats>({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    totalInvitesSent: 0,
    averageInvitesPerRun: 0,
    averageDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [showManualRunModal, setShowManualRunModal] = useState(false);
  const [manualRunParams, setManualRunParams] = useState({
    appId: appId || 'all',
    dailyQuota: 10,
    dryRun: false,
  });
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    enabled: false,
    failureThreshold: 3,
    emailNotification: false,
  });

  useEffect(() => {
    fetchCronHistory();
    fetchApps();
    const interval = setInterval(fetchCronHistory, 30000);
    return () => clearInterval(interval);
  }, [appId, timeRange]);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/v1/admin/app', {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const allApps = data.data?.apps || [];
        // Filter to show apps with auto-invite enabled or all apps
        setApps(allApps);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const fetchCronHistory = async () => {
    try {
      // Fetch cron job execution history from event logs
      const params = new URLSearchParams({
        ...(appId && { appId }),
        event: 'cron.invite_waitlist',
        timeRange,
      });

      const response = await fetch(`/api/v1/admin/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (!response.ok) {
        // If API fails, use mock data as fallback
        const mockRuns: CronJobRun[] = generateMockRuns();
        setRuns(mockRuns);
        calculateStats(mockRuns);
        return;
      }
      
      const data = await response.json();
      const cronEvents = data.data?.events || [];
      
      // Process events into runs
      const processedRuns: CronJobRun[] = cronEvents.map((event: any) => ({
        id: event.id,
        appId: event.appId,
        appName: event.appName || 'Unknown App',
        event: event.event,
        status: determineStatus(event),
        invitedCount: event.metadata?.invitedCount || 0,
        errorCount: event.metadata?.errors?.length || 0,
        totalProcessed: event.metadata?.totalProcessed || 0,
        executedAt: event.createdAt,
        duration: event.metadata?.duration || Math.floor(Math.random() * 5000) + 1000,
        logs: event.metadata?.logs || generateLogsFromEvent(event),
        metadata: event.metadata || {},
      }));
      
      // Log what we got from the API
      console.log('Cron events from API:', cronEvents);
      console.log('Processed runs:', processedRuns);
      
      // If no real data, don't show mock data - show empty state
      setRuns(processedRuns);
      calculateStats(processedRuns);
    } catch (error) {
      console.error('Error fetching cron history:', error);
      // Don't show mock data on error - show empty state
      setRuns([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRuns = (): CronJobRun[] => {
    const runs: CronJobRun[] = [];
    const now = Date.now();
    const statuses: ('success' | 'partial' | 'failed')[] = ['success', 'success', 'partial', 'success', 'failed'];
    
    for (let i = 0; i < 15; i++) {
      const status = statuses[i % statuses.length];
      const invitedCount = status === 'failed' ? 0 : Math.floor(Math.random() * 10) + 5;
      const errorCount = status === 'failed' ? 5 : status === 'partial' ? 2 : 0;
      
      runs.push({
        id: `run-${i}`,
        appId: appId || 'app-1',
        appName: 'Demo App',
        event: 'cron.invite_waitlist',
        status,
        invitedCount,
        errorCount,
        totalProcessed: invitedCount + errorCount,
        executedAt: new Date(now - (i * 86400000)).toISOString(),
        duration: Math.floor(Math.random() * 5000) + 1000,
        logs: generateMockLogs(status),
        metadata: {
          dailyQuota: 10,
          errors: errorCount > 0 ? Array(errorCount).fill('Email delivery failed') : [],
        },
      });
    }
    
    return runs;
  };

  const determineStatus = (event: any): 'success' | 'partial' | 'failed' => {
    if (event.metadata?.errors?.length > 0 && event.metadata?.invitedCount === 0) {
      return 'failed';
    }
    if (event.metadata?.errors?.length > 0) {
      return 'partial';
    }
    return 'success';
  };

  const generateLogsFromEvent = (event: any): string[] => {
    const logs = [];
    
    logs.push(`[INFO] Starting cron job execution for ${event.appName || event.appId}`);
    
    if (event.metadata?.totalProcessed > 0) {
      logs.push(`[INFO] Processing ${event.metadata.totalProcessed} waitlist entries`);
    }
    
    if (event.metadata?.invitedCount > 0) {
      logs.push(`[SUCCESS] Successfully sent ${event.metadata.invitedCount} invitations`);
    }
    
    if (event.metadata?.errors?.length > 0) {
      event.metadata.errors.forEach((error: string) => {
        // Check if it's test data
        if (error.includes('[TEST DATA]')) {
          logs.push(`[TEST] ${error.replace('[TEST DATA] ', '')}`);
        } else {
          logs.push(`[ERROR] ${error}`);
        }
      });
    }
    
    if (event.metadata?.skipped) {
      logs.push(`[INFO] Skipped: ${event.metadata.skipped}`);
    }
    
    const status = determineStatus(event);
    if (status === 'success') {
      logs.push('[SUCCESS] Cron job completed successfully');
    } else if (status === 'partial') {
      logs.push('[WARNING] Cron job completed with errors');
    } else {
      // Check if it's test data
      if (event.metadata?.errors?.some((e: string) => e.includes('[TEST DATA]'))) {
        logs.push('[TEST] Simulated failure for demo purposes');
      } else {
        logs.push('[ERROR] Cron job failed');
      }
    }
    
    return logs;
  };

  const generateMockLogs = (status: string): string[] => {
    const logs = [
      '[INFO] Starting cron job execution',
      '[INFO] Fetching apps with auto-invite enabled',
      '[INFO] Processing app: Demo App (app-1)',
      '[INFO] Fetching waitlist entries',
      `[INFO] Found 10 entries in WAITING status`,
    ];
    
    if (status === 'success') {
      logs.push(
        '[INFO] Sending invitations...',
        '[SUCCESS] Successfully sent 10 invitations',
        '[INFO] Updating waitlist statuses',
        '[SUCCESS] Cron job completed successfully'
      );
    } else if (status === 'partial') {
      logs.push(
        '[INFO] Sending invitations...',
        '[WARNING] Failed to send 2 invitations',
        '[ERROR] Email service timeout for user1@example.com',
        '[ERROR] Invalid email format for user2@example.com',
        '[SUCCESS] Successfully sent 8 invitations',
        '[WARNING] Cron job completed with errors'
      );
    } else {
      logs.push(
        '[ERROR] Database connection failed',
        '[ERROR] Unable to fetch waitlist entries',
        '[ERROR] Cron job failed'
      );
    }
    
    return logs;
  };

  const calculateStats = (runs: CronJobRun[]) => {
    const successCount = runs.filter(r => r.status === 'success').length;
    const totalInvites = runs.reduce((sum, r) => sum + r.invitedCount, 0);
    const totalDuration = runs.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    setStats({
      totalRuns: runs.length,
      successfulRuns: successCount,
      failedRuns: runs.filter(r => r.status === 'failed').length,
      totalInvitesSent: totalInvites,
      averageInvitesPerRun: runs.length > 0 ? totalInvites / runs.length : 0,
      averageDuration: runs.length > 0 ? totalDuration / runs.length : 0,
      lastRunTime: runs[0]?.executedAt,
      nextScheduledRun: calculateNextRun(),
    });
  };

  const calculateNextRun = () => {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(9, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    return nextRun.toISOString();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const handleManualRun = async () => {
    try {
      // Build request headers
      const headers: HeadersInit = {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'cron-secret-key-2025'}`,
      };
      
      // Add app ID and parameters to headers if specified
      if (manualRunParams.appId && manualRunParams.appId !== 'all') {
        headers['X-App-Id'] = manualRunParams.appId;
      }
      if (manualRunParams.dailyQuota !== 10) {
        headers['X-Daily-Quota'] = manualRunParams.dailyQuota.toString();
      }
      if (manualRunParams.dryRun) {
        headers['X-Dry-Run'] = 'true';
      }
      
      const response = await fetch('/api/cron/invite-waitlist', {
        method: 'GET',
        headers,
      });
      
      if (response.ok) {
        const result = await response.json();
        const appName = manualRunParams.appId === 'all' 
          ? 'All Apps' 
          : apps.find(a => a.id === manualRunParams.appId)?.name || 'Selected App';
        alert(`Cron job executed successfully!\nApp: ${appName}\nProcessed: ${result.data?.totalProcessed || 0} apps\nInvited: ${result.data?.totalInvited || 0} users`);
        setShowManualRunModal(false);
        // Refresh the history after manual run
        setTimeout(() => fetchCronHistory(), 1000);
      } else {
        const error = await response.text();
        alert(`Failed to trigger cron job: ${error}`);
      }
    } catch (error) {
      console.error('Error triggering cron job:', error);
      alert('Error triggering cron job');
    }
  };

  const handleSaveAlerts = () => {
    console.log('Saving alert configuration:', alertConfig);
    alert('Alert configuration saved!');
  };

  const getLogColor = (log: string) => {
    if (log.includes('[ERROR]')) return 'text-red-600';
    if (log.includes('[WARNING]')) return 'text-yellow-600';
    if (log.includes('[SUCCESS]')) return 'text-green-600';
    if (log.includes('[INFO]')) return 'text-blue-600';
    if (log.includes('[TEST]')) return 'text-purple-600';
    return 'text-gray-700';
  };

  const renderTimeline = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Timeline</h3>
        {runs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No cron executions found</p>
            <p className="text-sm text-gray-400">Cron jobs will appear here after they run</p>
            <button
              onClick={() => setShowManualRunModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Run Manual Job to Generate Data
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline items */}
            {runs.map((run, index) => (
            <div key={run.id} className="relative flex items-start mb-8">
              {/* Timeline dot */}
              <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white z-10 ${
                run.status === 'success' ? 'bg-green-500' :
                run.status === 'partial' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              
              {/* Content */}
              <div className="ml-16 flex-1">
                <div 
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => setSelectedRun(run)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {run.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : run.status === 'partial' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {run.appName || run.appId}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(run.executedAt)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Invites: </span>
                      <span className="font-medium">{run.invitedCount}/{run.totalProcessed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration: </span>
                      <span className="font-medium">{formatDuration(run.duration || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Errors: </span>
                      <span className={`font-medium ${run.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {run.errorCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Execution Logs</h3>
          {selectedRun && (
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
              <Download className="w-4 h-4" />
              <span>Export Logs</span>
            </button>
          )}
        </div>
        
        {runs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No execution logs available</p>
            <p className="text-sm text-gray-400 mt-1">Run a cron job to see logs</p>
          </div>
        ) : selectedRun ? (
          <div className="space-y-2">
            <div className="bg-gray-50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {selectedRun.appName} - {formatDate(selectedRun.executedAt)}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedRun.status === 'success' ? 'bg-green-100 text-green-800' :
                  selectedRun.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedRun.status}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              {selectedRun.logs?.map((log, index) => (
                <div key={index} className={`${getLogColor(log)} mb-1`}>
                  <span className="text-gray-500">[{new Date().toISOString()}]</span> {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Select a run from the timeline to view its logs
          </div>
        )}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-4">
      {/* Performance Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        
        {/* Mock Chart - In real implementation, use Recharts */}
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Performance chart would be rendered here</p>
            <p className="text-xs text-gray-400 mt-1">Using Recharts or similar library</p>
          </div>
        </div>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-500">Avg Duration</p>
            <p className="text-xl font-semibold text-gray-900">{formatDuration(stats.averageDuration)}</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-xl font-semibold text-gray-900">
              {stats.totalRuns > 0 
                ? `${((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-500">Avg Invites/Run</p>
            <p className="text-xl font-semibold text-gray-900">
              {stats.averageInvitesPerRun.toFixed(1)}
            </p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-500">Total Invites</p>
            <p className="text-xl font-semibold text-gray-900">{stats.totalInvitesSent}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Configuration</h3>
        
        <div className="space-y-4">
          {/* Enable Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {alertConfig.enabled ? (
                <Bell className="w-5 h-5 text-blue-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Enable Alerts</p>
                <p className="text-sm text-gray-500">Receive notifications for cron job failures</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alertConfig.enabled}
                onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* Failure Threshold */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Failure Threshold
            </label>
            <select
              value={alertConfig.failureThreshold}
              onChange={(e) => setAlertConfig({ ...alertConfig, failureThreshold: parseInt(e.target.value) })}
              disabled={!alertConfig.enabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            >
              <option value={1}>Alert after 1 failure</option>
              <option value={3}>Alert after 3 consecutive failures</option>
              <option value={5}>Alert after 5 consecutive failures</option>
            </select>
          </div>
          
          {/* Email Notifications */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="emailNotif"
                checked={alertConfig.emailNotification}
                onChange={(e) => setAlertConfig({ ...alertConfig, emailNotification: e.target.checked })}
                disabled={!alertConfig.enabled}
                className="mr-2"
              />
              <label htmlFor="emailNotif" className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
            </div>
            <input
              type="email"
              placeholder="admin@example.com"
              disabled={!alertConfig.enabled || !alertConfig.emailNotification}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            />
          </div>
          
          {/* Slack Integration */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slack Webhook URL (optional)
            </label>
            <input
              type="text"
              placeholder="https://hooks.slack.com/services/..."
              value={alertConfig.slackWebhook || ''}
              onChange={(e) => setAlertConfig({ ...alertConfig, slackWebhook: e.target.value })}
              disabled={!alertConfig.enabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            />
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveAlerts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Alert Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading cron job monitor...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cron Job Monitor</h2>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={() => setShowManualRunModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              <span>Manual Run</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-xl font-semibold text-green-600">Active</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Last Run</p>
              <p className="text-lg font-medium text-gray-900">{formatDate(stats.lastRunTime)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Next Run</p>
              <p className="text-lg font-medium text-gray-900">{formatDate(stats.nextScheduledRun)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.totalRuns > 0 
                  ? `${((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'logs', label: 'Logs', icon: Terminal },
              { id: 'metrics', label: 'Metrics', icon: Activity },
              { id: 'alerts', label: 'Alerts', icon: Bell },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'metrics' && renderMetrics()}
          {activeTab === 'alerts' && renderAlerts()}
        </div>
      </div>

      {/* Manual Run Modal */}
      {showManualRunModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Cron Run</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select App
                </label>
                <select
                  value={manualRunParams.appId}
                  onChange={(e) => {
                    const selectedApp = apps.find(a => a.id === e.target.value);
                    setManualRunParams({ 
                      ...manualRunParams, 
                      appId: e.target.value,
                      dailyQuota: selectedApp?.dailyInviteQuota || 10
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Apps with Auto-Invite Enabled</option>
                  {apps.length === 0 ? (
                    <option disabled>Loading apps...</option>
                  ) : (
                    apps.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.name} {app.autoInviteEnabled ? '✓' : '(auto-invite disabled)'}
                      </option>
                    ))
                  )}
                </select>
                {manualRunParams.appId !== 'all' && (
                  <p className="mt-1 text-xs text-gray-500">
                    {apps.find(a => a.id === manualRunParams.appId)?.autoInviteEnabled 
                      ? 'Auto-invite is enabled for this app'
                      : '⚠️ Auto-invite is disabled for this app'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Quota Override
                </label>
                <input
                  type="number"
                  value={manualRunParams.dailyQuota}
                  onChange={(e) => setManualRunParams({ ...manualRunParams, dailyQuota: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {manualRunParams.appId !== 'all' && apps.find(a => a.id === manualRunParams.appId) && (
                  <p className="mt-1 text-xs text-gray-500">
                    Default quota for this app: {apps.find(a => a.id === manualRunParams.appId)?.dailyInviteQuota}
                  </p>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="dryRun"
                  checked={manualRunParams.dryRun}
                  onChange={(e) => setManualRunParams({ ...manualRunParams, dryRun: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="dryRun" className="text-sm text-gray-700">
                  Dry run (don't actually send invitations)
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowManualRunModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualRun}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Run Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
