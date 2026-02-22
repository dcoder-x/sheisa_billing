import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EntityDashboard } from '@/components/entity-dashboard';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  
  // Redirect super admin to their dashboard
  if (session.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  return (
    <EntityDashboard />
  );
}
