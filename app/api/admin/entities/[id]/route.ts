import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const { status } = body; // 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

        if (!status) {
            return NextResponse.json({ message: 'Status is required' }, { status: 400 });
        }

        const updatedEntity = await prisma.entity.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updatedEntity);
    } catch (error) {
        console.error('Error updating entity:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;

        // Optional: Check if entity has critical data that prevents deletion?
        // Prisma limit: Cascade delete handles relations usually, but might want to be careful.
        // Allow delete for now as requested.

        await prisma.entity.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Entity deleted successfully' });
    } catch (error) {
        console.error('Error deleting entity:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
