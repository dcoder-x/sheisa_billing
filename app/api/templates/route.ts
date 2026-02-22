import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session || !session.entityId) {
        return NextResponse.json(
            { message: 'Unauthorized - Entity ID missing' },
            { status: 401 }
        );
    }

    try {
        const templates = await prisma.invoiceTemplate.findMany({
            where: {
                entityId: session.entityId,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session || !session.entityId) {
        return NextResponse.json(
            { message: 'Unauthorized - Entity ID missing' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { name, content, type, sourceUrl, design } = body;

        if (!name) {
            return NextResponse.json(
                { message: 'Name is required' },
                { status: 400 }
            );
        }

        const newTemplate = await prisma.invoiceTemplate.create({
            data: {
                name,
                content: content || '',
                type: type || 'CUSTOM',
                sourceUrl,
                design: design || {},
                entityId: session.entityId,
            },
        });

        return NextResponse.json(newTemplate, { status: 201 });
    } catch (error: any) {
        console.error('Error creating template:', error);

        // Handle foreign key constraint violation (stale session entityId)
        if (error.code === 'P2003') {
            return NextResponse.json(
                { message: 'Session invalid. Please log out and log in again.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
