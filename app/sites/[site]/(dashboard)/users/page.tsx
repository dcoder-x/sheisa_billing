import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { UserManager } from './user-manager';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Only SUPER_ADMIN and ENTITY_ADMIN can view this page
  if (session.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  if (session.role === 'ENTITY_USER') {
    redirect('/');
  }

  const entityId = session.entityId;
  if (!entityId) {
    return <div className="p-8">No entity context found</div>;
  }

  const awaitedSearchParams = await searchParams;
  const q = awaitedSearchParams?.q || '';
  const page = Number(awaitedSearchParams?.page) || 1;
  const pageSize = 10;

  const where: Prisma.UserWhereInput = {
    entityId,
  };

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      }
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="h-full bg-slate-50">
      <UserManager 
        initialUsers={users} 
        totalItems={totalItems} 
        pageSize={pageSize} 
        currentUserId={session.userId}
      />
    </div>
  );
}
