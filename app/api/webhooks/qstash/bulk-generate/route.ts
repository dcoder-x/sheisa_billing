import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { bulkGenerationService } from '@/lib/services/bulk-generation.service';

async function handler(req: NextRequest) {
    try {
        const body = await req.json();

        // Pass the subset of rows to the service for processing
        await bulkGenerationService.processBatch(body);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('QStash Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Ensure the endpoint is only callable by QStash
export const POST = verifySignatureAppRouter(handler);
