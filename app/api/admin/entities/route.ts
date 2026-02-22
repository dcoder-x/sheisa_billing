import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const entities = await prisma.entity.findMany({
            where: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { registrationNumber: { contains: search, mode: 'insensitive' } },
                ],
            },
            include: {
                _count: {
                    select: { users: true, invoices: true },
                },
                invoices: {
                    where: { status: 'PAID' },
                    select: { amount: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const formattedEntities = entities.map((entity: any) => {
            const revenue = entity.invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
            return {
                id: entity.id,
                name: entity.name,
                regNumber: entity.registrationNumber,
                email: entity.email,
                status: entity.status, // ACTIVE, INACTIVE, SUSPENDED
                users: entity._count.users,
                invoicesCount: entity._count.invoices,
                revenue: revenue,
                createdAt: entity.createdAt
            };
        });

        return NextResponse.json(formattedEntities);
    } catch (error) {
        console.error('Error fetching entities:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
