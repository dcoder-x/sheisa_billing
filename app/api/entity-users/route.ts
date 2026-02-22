import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendNewAccountEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ENTITY_ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { fullName, email, role } = await request.json();

        if (!fullName || !email || !role) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: { email, entityId: session.entityId }
        });

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists in this entity' }, { status: 400 });
        }

        // Generate secure temp password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                role,
                password: hashedPassword,
                entityId: session.entityId,
                forcePasswordReset: true,
            }
        });

        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = request.headers.get('host');
        const loginUrl = `${protocol}://${host}/login`;

        // Send the email
        await sendNewAccountEmail(email, fullName, tempPassword, loginUrl);

        return NextResponse.json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
