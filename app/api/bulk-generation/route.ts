import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { bulkGenerationService } from '@/lib/services/bulk-generation.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.userId || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const contentType = request.headers.get('content-type') || '';

        // Handle new standard invoice JSON flow
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { isStandardInvoice, rows } = body;

            if (!rows || rows.length === 0) {
                return NextResponse.json({ message: 'Missing rows array' }, { status: 400 });
            }

            const job = await bulkGenerationService.startBulkGeneration({
                userId: session.userId,
                entityId: session.entityId,
                rows,
                isStandardInvoice: true,
                notifyEmail: session.email
            });

            return NextResponse.json({ success: true, data: job }, { status: 201 });
        }

        // Handling legacy template FormData flow
        const formData = await request.formData();
        const templateId = formData.get('templateId') as string | null;
        const csvFile = formData.get('csv') as File;

        if (!csvFile) {
            return NextResponse.json({ message: 'Missing csv file' }, { status: 400 });
        }

        const job = await bulkGenerationService.startBulkGeneration({
            userId: session.userId,
            entityId: session.entityId,
            templateId: templateId || undefined,
            csvData: csvFile,
            notifyEmail: session.email
        });

        return NextResponse.json({ success: true, data: job }, { status: 201 });
    } catch (error: any) {
        console.error('Bulk generation error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const jobs = await prisma.bulkGenerationJob.findMany({
            where: { entityId: session.entityId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return NextResponse.json(jobs);
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
