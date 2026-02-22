import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAccountSuspendedEmail, sendAccountReactivatedEmail } from '@/lib/email';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ENTITY_ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { status } = await request.json();

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.entityId !== session.entityId) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.id === session.userId) {
            return NextResponse.json({ message: 'Cannot modify your own status' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status }
        });

        // Send appropriate email
        if (status === 'SUSPENDED') {
            await sendAccountSuspendedEmail(user.email, user.fullName);
        } else if (status === 'ACTIVE') {
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const host = request.headers.get('host');
            const loginUrl = `${protocol}://${host}/login`;
            await sendAccountReactivatedEmail(user.email, user.fullName, loginUrl);
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ENTITY_ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.entityId !== session.entityId) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.id === session.userId) {
            return NextResponse.json({ message: 'Cannot delete yourself' }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
