import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { LiveChatInterface } from './LiveChatInterface';

export default async function AdminLiveChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const resolvedParams = await params;

  return <LiveChatInterface conversationId={resolvedParams.conversationId} />;
}

