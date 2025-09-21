import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import AppCreationWizard from './AppCreationWizard';

export default async function NewAppPage() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return <AppCreationWizard />;
}
