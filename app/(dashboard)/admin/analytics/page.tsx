import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AnalyticsClient } from './analytics-client';

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <AnalyticsClient />
  );
}
