import { EntityDashboard } from '@/components/entity-dashboard';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';

export default async function TenantRootPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const subdomain = site;

  // 1. Verify Entity Exists
  const entity = await prisma.entity.findUnique({
    where: { subdomain },
  });

  if (!entity) {
    notFound();
  }

  // 2. Verify Session
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // 3. Verify User belongs to this Entity or is Super Admin
  const isSuperAdmin = session.role === 'SUPER_ADMIN';
  const belongsToEntity = session.entityId === entity.id;

  if (!isSuperAdmin && !belongsToEntity) {
     // User is logged in but trying to access another entity's dashboard
     return (
        <div className="p-8 flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2 text-slate-600">You do not have permission to view {entity.name}'s dashboard.</p>
                <a href="/api/auth/logout" className="mt-4 inline-block text-blue-600 hover:underline">Sign Out</a>
            </div>
        </div>
     );
  }

  return <EntityDashboard />;
}
