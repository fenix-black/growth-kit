import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import AppDetailDashboard from './AppDetailDashboard';

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return <AppDetailDashboard appId={params.id} />;
}
