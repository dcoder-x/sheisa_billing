import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { bulkGenerationService } from '@/lib/services/bulk-generation.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const templateId = formData.get('templateId') as string;
        const csvFile = formData.get('csv') as File;

        if (!templateId || !csvFile) {
            return NextResponse.json({ message: 'Missing templateId or csv file' }, { status: 400 });
        }

        const job = await bulkGenerationService.startBulkGeneration({
            userId: session.userId,
            templateId,
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
