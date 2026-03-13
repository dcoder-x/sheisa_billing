import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const reportType = body.type || 'FINANCIAL';

        const report = await prisma.report.create({
            data: {
                entityId: session.entityId,
                reportType: reportType,
                generatedDate: new Date(),
                filePath: `/mock-report-${Date.now()}.pdf`, // Mock file path for demonstration
            }
        });

        return NextResponse.json({ message: 'Report generated', report }, { status: 201 });
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
