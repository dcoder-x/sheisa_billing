import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session || !session.entityId) {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const recentInvoices = await prisma.invoice.findMany({
            where: {
                entityId: session.entityId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        });

        // Format dates and amounts for the table
        const formattedInvoices = recentInvoices.map(inv => {
            // Map status to nice colors
            let statusColor = 'bg-slate-50 text-slate-700';
            if (inv.status === 'PAID') statusColor = 'bg-green-50 text-green-700';
            if (inv.status === 'PENDING') statusColor = 'bg-orange-50 text-orange-700';
            if (inv.status === 'CANCELLED') statusColor = 'bg-red-50 text-red-700';
            if (inv.status === 'OVERDUE') statusColor = 'bg-red-100 text-red-800';

            return {
                id: inv.invoiceNumber,
                price: `$${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                date: new Date(inv.createdAt).toLocaleString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }),
                status: inv.status.charAt(0) + inv.status.slice(1).toLowerCase(),
                statusColor,
            }
        });

        return NextResponse.json(formattedInvoices);
    } catch (error) {
        console.error('Error fetching recent invoices:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
