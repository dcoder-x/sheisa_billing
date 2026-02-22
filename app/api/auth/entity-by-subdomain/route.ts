import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Internal API endpoint for middleware to look up entity by subdomain
// Protected by a simple secret header to prevent public abuse
export async function GET(request: NextRequest) {
    const internalSecret = process.env.INTERNAL_API_SECRET || 'internal';
    const providedSecret = request.headers.get('x-internal-auth');

    if (providedSecret !== internalSecret) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const subdomain = request.nextUrl.searchParams.get('subdomain');

    if (!subdomain) {
        return NextResponse.json({ message: 'Subdomain required' }, { status: 400 });
    }

    try {
        const entity = await prisma.entity.findUnique({
            where: { subdomain },
            select: { id: true, name: true, subdomain: true },
        });

        if (!entity) {
            return NextResponse.json({ message: 'Entity not found' }, { status: 404 });
        }

        return NextResponse.json(entity);
    } catch (error) {
        console.error('Entity lookup error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
