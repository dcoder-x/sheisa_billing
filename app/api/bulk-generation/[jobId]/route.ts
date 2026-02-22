import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const session = await getSession();
    if (!session || !session.entityId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    try {
        const job = await prisma.bulkGenerationJob.findUnique({
            where: {
                id: jobId,
                entityId: session.entityId // Security check
            },
        });

        if (!job) {
            return NextResponse.json({ message: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json(job);
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
