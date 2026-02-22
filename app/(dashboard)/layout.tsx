import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let entity = null;
  if (session.entityId) {
    entity = await prisma.entity.findUnique({
      where: { id: session.entityId },
      select: { name: true, logoUrl: true, themeColor: true, subdomain: true }
    });
  }

  return (
    <div className="flex h-screen w-full bg-slate-100">
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
