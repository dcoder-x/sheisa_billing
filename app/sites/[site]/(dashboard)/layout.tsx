
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { prisma } from '@/lib/prisma';

export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ site: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { site } = await params;
  const subdomain = site;

  if (session.forcePasswordReset) {
    redirect(`/sites/${site}/set-password`);
  }

  // We fetch the entity based on subdomain to ensure we show the correct branding/context
  // even if the user session might have a different entityId (though that should be blocked by page logic)
  // Actually, for the layout, we want to show the entity context of the SITE we are on.
  
  const entity = await prisma.entity.findUnique({
    where: { subdomain },
    select: { name: true, logoUrl: true, themeColor: true, subdomain: true, id: true }
  });

  return (
    <div className="flex h-screen w-full bg-slate-100">
      {/* We pass the entity derived from the subdomain so the Sidebar/Header reflects the tenant context */}
      <Sidebar session={session} entity={entity} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} entity={entity} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
