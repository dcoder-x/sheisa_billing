import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin-dashboard';

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <AdminDashboard />
  );
}
