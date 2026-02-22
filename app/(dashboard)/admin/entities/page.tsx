import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EntitiesTable } from '@/components/entities-table';

export default async function AdminEntitiesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
          <div className="p-8 max-w-7xl mx-auto">
            <EntitiesTable />
          </div>
  );
}
