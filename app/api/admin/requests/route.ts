import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getSession();

    // Ensure user is authenticated and is a Super Admin
    if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }

        const requests = await prisma.registrationRequest.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching registration requests:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
