import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params are now Promises in Next.js 15+ or latest App Router
) {
    const session = await getSession();
    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const template = await prisma.invoiceTemplate.findUnique({
            where: {
                id,
                entityId: session.entityId,
            },
        });

        if (!template) {
            return NextResponse.json({ message: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { name, content, type, sourceUrl, design } = body;

        if (!name) {
            return NextResponse.json({ message: 'Name is required' }, { status: 400 });
        }

        const updatedTemplate = await prisma.invoiceTemplate.update({
            where: {
                id,
                entityId: session.entityId,
            },
            data: {
                name,
                content,
                type,
                sourceUrl,
                design,
            },
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.invoiceTemplate.delete({
            where: {
                id,
                entityId: session.entityId,
            },
        });

        return NextResponse.json({ message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Parse the partial update body
        const body = await request.json();

        // Extract allowed fields for update
        const { name, content, type, sourceUrl, design } = body;

        // Build data object with only defined fields (partial update)
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (content !== undefined) updateData.content = content;
        if (type !== undefined) updateData.type = type;
        if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl;
        if (design !== undefined) updateData.design = design;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
        }

        const updatedTemplate = await prisma.invoiceTemplate.update({
            where: {
                id,
                entityId: session.entityId,
            },
            data: updateData,
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error('Error patching template:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
