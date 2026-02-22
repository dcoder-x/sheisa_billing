import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { password } = await request.json();

        if (!password || password.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user record
        const updatedUser = await prisma.user.update({
            where: { id: session.userId },
            data: {
                password: hashedPassword,
                forcePasswordReset: false,
            },
        });

        // Refresh the session token with the updated reset flag
        await createSession({
            userId: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            role: updatedUser.role,
            entityId: updatedUser.entityId || undefined,
            status: updatedUser.status,
            forcePasswordReset: false,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { message: 'An error occurred while updating the password' },
            { status: 500 }
        );
    }
}
