import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import AppsListing from './AppsListing';

export default async function AppsPage() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return <AppsListing />;
}
