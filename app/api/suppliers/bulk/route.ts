import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
        const { suppliers } = body;

        if (!Array.isArray(suppliers) || suppliers.length === 0) {
            return NextResponse.json(
                { message: 'Invalid or empty suppliers data' },
                { status: 400 }
            );
        }

        // Validate basic fields for all suppliers
        const validSuppliers = suppliers.filter(s => s.name && s.email).map(s => ({
            name: s.name,
            email: s.email,
            phone: s.phone || '',
            address: s.address || '',
            bankAccount: s.bankAccount || null,
            entityId: session.entityId as string,
            status: 'ACTIVE' as const,
        }));

        if (validSuppliers.length === 0) {
            return NextResponse.json(
                { message: 'No valid suppliers found in the uploaded data. Ensure Name and Email columns exist.' },
                { status: 400 }
            );
        }

        const result = await prisma.supplier.createMany({
            data: validSuppliers,
            skipDuplicates: true, // Though there's no unique constraint natively in the schema for supplier email
        });

        return NextResponse.json({
            message: `Successfully imported ${result.count} suppliers.`,
            count: result.count
        }, { status: 201 });
    } catch (error) {
        console.error('Error importing suppliers:', error);
        return NextResponse.json(
            { message: 'Internal server error while importing' },
            { status: 500 }
        );
    }
}
