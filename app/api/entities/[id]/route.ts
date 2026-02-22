import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();

        if (!session || session.role !== 'ENTITY_ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify the entity belongs to the session
        if (session.entityId !== id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const updateData: any = {};

        if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
        if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        const updatedEntity = await prisma.entity.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedEntity);
    } catch (error) {
        console.error('Update entity error:', error);
        return NextResponse.json(
            { message: 'An error occurred while updating the entity' },
            { status: 500 }
        );
    }
}
