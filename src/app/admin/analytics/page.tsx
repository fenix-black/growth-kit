import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return <AnalyticsDashboard />;
}
