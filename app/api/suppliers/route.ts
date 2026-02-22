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
        const suppliers = await prisma.supplier.findMany({
            where: {
                entityId: session.entityId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: { invoices: true },
                },
            },
        });

        return NextResponse.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
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
        const { name, email, phone, address, bankAccount } = body;

        // Basic validation
        if (!name || !email) {
            return NextResponse.json(
                { message: 'Name and Email are required' },
                { status: 400 }
            );
        }

        const newSupplier = await prisma.supplier.create({
            data: {
                name,
                email,
                phone: phone || '',
                address: address || '',
                bankAccount,
                entityId: session.entityId,
                status: 'ACTIVE',
            },
        });

        return NextResponse.json(newSupplier, { status: 201 });
    } catch (error) {
        console.error('Error creating supplier:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
