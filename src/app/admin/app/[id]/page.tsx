import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import AppDetailDashboard from './AppDetailDashboard';

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  // Await params as required in Next.js 15+
  const { id } = await params;

  return <AppDetailDashboard appId={id} />;
}
