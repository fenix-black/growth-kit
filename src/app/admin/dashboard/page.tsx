import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import DashboardOverview from './DashboardOverview';

export default async function DashboardPage() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return <DashboardOverview />;
}
