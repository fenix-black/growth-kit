'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface UsdMetrics {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    uniqueUsers: number;
    avgTransactionValue: number;
    minTransactionValue: number;
    maxTransactionValue: number;
    avgUserValue: number;
  };
  byUser?: Array<{
    fingerprintId: string;
    referralCode?: string;
    email?: string;
    name?: string;
    totalSpent: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
  byAction?: Array<{
    action: string;
    totalRevenue: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
  timeline?: Array<{
    period: string;
    revenue: number;
    transactionCount: number;
    avgTransactionValue: number;
  }>;
}

interface UsdMetricsDashboardProps {
  appId: string;
  appName: string;
}

export default function UsdMetricsDashboard({ appId, appName }: UsdMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<UsdMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [groupBy, setGroupBy] = useState('user');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, [appId, period, groupBy, startDate, endDate]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        appId,
        period,
        groupBy,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/v1/admin/metrics/usd?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch USD metrics');
      
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Error fetching USD metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = async () => {
    try {
      const response = await fetch('/api/v1/admin/metrics/usd', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SERVICE_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appId, startDate, endDate })
      });

      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usd-metrics-${appName}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <div className={styles.loading}>Loading USD metrics...</div>;
  }

  if (!metrics) {
    return <div className={styles.error}>Failed to load USD metrics</div>;
  }

  return (
    <div className={styles.metricsContainer}>
      <div className={styles.metricsHeader}>
        <h2>💵 USD Value Tracking</h2>
        <button onClick={exportToCsv} className={styles.exportButton}>
          📊 Export to CSV
        </button>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>Period:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">All Time</option>
            <option value="daily">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Group By:</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="user">User</option>
            <option value="action">Action</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Start Date:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>End Date:</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.metricCard}>
          <h3>Total Revenue</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.summary.totalRevenue)}</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Total Transactions</h3>
          <div className={styles.metricValue}>{metrics.summary.totalTransactions}</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Unique Users</h3>
          <div className={styles.metricValue}>{metrics.summary.uniqueUsers}</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Avg Transaction</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.summary.avgTransactionValue)}</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Avg User Value</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.summary.avgUserValue)}</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Value Range</h3>
          <div className={styles.metricValue}>
            {formatCurrency(metrics.summary.minTransactionValue)} - {formatCurrency(metrics.summary.maxTransactionValue)}
          </div>
        </div>
      </div>

      {/* Data Tables based on grouping */}
      {metrics.byUser && (
        <div className={styles.dataTable}>
          <h3>Revenue by User</h3>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Total Spent</th>
                <th>Transactions</th>
                <th>Avg Transaction</th>
                <th>Referral Code</th>
              </tr>
            </thead>
            <tbody>
              {metrics.byUser.map((user, idx) => (
                <tr key={idx}>
                  <td>{user.name || user.fingerprintId.substring(0, 8) + '...'}</td>
                  <td>{user.email || '-'}</td>
                  <td>{formatCurrency(user.totalSpent)}</td>
                  <td>{user.transactionCount}</td>
                  <td>{formatCurrency(user.avgTransactionValue)}</td>
                  <td>{user.referralCode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {metrics.byAction && (
        <div className={styles.dataTable}>
          <h3>Revenue by Action</h3>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Total Revenue</th>
                <th>Transactions</th>
                <th>Avg Transaction</th>
              </tr>
            </thead>
            <tbody>
              {metrics.byAction.map((action, idx) => (
                <tr key={idx}>
                  <td>{action.action}</td>
                  <td>{formatCurrency(action.totalRevenue)}</td>
                  <td>{action.transactionCount}</td>
                  <td>{formatCurrency(action.avgTransactionValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {metrics.timeline && (
        <div className={styles.dataTable}>
          <h3>Revenue Timeline</h3>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Revenue</th>
                <th>Transactions</th>
                <th>Avg Transaction</th>
              </tr>
            </thead>
            <tbody>
              {metrics.timeline.map((period, idx) => (
                <tr key={idx}>
                  <td>{period.period}</td>
                  <td>{formatCurrency(period.revenue)}</td>
                  <td>{period.transactionCount}</td>
                  <td>{formatCurrency(period.avgTransactionValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
