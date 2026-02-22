import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  let entity = null;
  if (session.entityId) {
    entity = await prisma.entity.findUnique({
      where: { id: session.entityId },
      select: { id: true, name: true, logoUrl: true, themeColor: true }
    });
  }

  return (
    <div className="bg-slate-50 min-h-full">
      <SettingsClient session={session} entity={entity} />
    </div>
  );
}
