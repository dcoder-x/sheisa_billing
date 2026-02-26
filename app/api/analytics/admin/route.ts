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
        // 1. Total Entities
        const totalEntities = await prisma.entity.count();

        // 2. Active Entities (vs Pending Registration)
        const activeEntities = await prisma.entity.count({
            where: { status: 'ACTIVE' }
        });

        const pendingRequests = await prisma.registrationRequest.count({
            where: { status: 'PENDING' }
        });

        // 3. Platform Revenue (Mock or sum of something?)
        // Let's assume we don't have platform fees yet. We can show "Total System Invoiced Volume"
        const totalVolume = await prisma.invoice.aggregate({
            _sum: { amount: true }
        });
        const volume = totalVolume._sum.amount || 0;

        // 4. Total Users
        const totalUsers = await prisma.user.count();

        return NextResponse.json({
            kpi: [
                { title: 'Total Entities', value: totalEntities.toString(), change: '', isPositive: true },
                { title: 'Pending Requests', value: pendingRequests.toString(), change: '', isPositive: false },
                { title: 'System Volume', value: new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(volume), change: '', isPositive: true },
                { title: 'Total Users', value: totalUsers.toString(), change: '', isPositive: true },
            ],
            // Distribution of Entities by Business Type
            distribution: await prisma.entity.groupBy({
                by: ['businessType'],
                _count: {
                    id: true
                }
            }).then(res => res.map(item => ({ name: item.businessType, value: item._count.id })))
        });

    } catch (error) {
        console.error('Error in admin analytics:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
