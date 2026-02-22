import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return NextResponse.json(
                { message: 'Valid current password and a new password (min 8 chars) are required' },
                { status: 400 }
            );
        }

        // Verify current password
        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Incorrect current password' },
                { status: 400 }
            );
        }

        // Hash and update to the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json(
            { message: 'An error occurred while changing your password' },
            { status: 500 }
        );
    }
}
