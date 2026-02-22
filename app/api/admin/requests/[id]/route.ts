import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendApprovalEmail, sendDeclineEmail } from '@/lib/email';

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getSession();

    // Ensure user is authenticated and is a Super Admin
    if (!session || session.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { id } = params;
        const body = await request.json();
        const { status, declineReason } = body;

        if (!status || !['APPROVED', 'DECLINED'].includes(status)) {
            return NextResponse.json(
                { message: 'Invalid status' },
                { status: 400 }
            );
        }

        const registrationRequest = await prisma.registrationRequest.findUnique({
            where: { id },
        });

        if (!registrationRequest) {
            return NextResponse.json(
                { message: 'Registration request not found' },
                { status: 404 }
            );
        }

        if (status === 'APPROVED') {
            // Create user from registration request
            const existingUser = await prisma.user.findUnique({
                where: { email: registrationRequest.email },
            });

            if (existingUser) {
                return NextResponse.json(
                    { message: 'User with this email already exists' },
                    { status: 409 }
                );
            }

            await prisma.$transaction(async (tx: any) => {
                // Create the Entity
                const newEntity = await tx.entity.create({
                    data: {
                        name: registrationRequest.entityName,
                        registrationNumber: registrationRequest.registrationNumber,
                        email: registrationRequest.email,
                        phone: registrationRequest.phone,
                        address: registrationRequest.address,
                        city: registrationRequest.city,
                        state: registrationRequest.state,
                        postalCode: registrationRequest.postalCode,
                        country: registrationRequest.country,
                        businessType: registrationRequest.businessType,
                        subdomain: registrationRequest.subdomain,
                        themeColor: registrationRequest.themeColor,
                        logoUrl: registrationRequest.logoUrl,
                        status: 'ACTIVE',
                    },
                });

                // Create the User linked to the Entity
                const newUser = await tx.user.create({
                    data: {
                        email: registrationRequest.email,
                        password: registrationRequest.password, // Already hashed
                        fullName: `Admin`, // Default name, or could use entity name
                        role: 'ENTITY_USER',
                        entityId: newEntity.id,
                    },
                });

                // Update request status
                await tx.registrationRequest.update({
                    where: { id },
                    data: {
                        status: 'APPROVED',
                        reviewedBy: session.userId,
                        reviewedAt: new Date(),
                    },
                });
            });

            // Send approval email
            await sendApprovalEmail(
                registrationRequest.email,
                registrationRequest.entityName,
                registrationRequest.subdomain || ''
            );
            console.log(`Sent approval email to ${registrationRequest.email}`);

            return NextResponse.json({ message: 'Request approved and user created' });
        } else {
            // Decline
            await prisma.registrationRequest.update({
                where: { id },
                data: {
                    status: 'DECLINED',
                    declineReason,
                    reviewedBy: session.userId,
                    reviewedAt: new Date(),
                },
            });

            // Send decline email
            await sendDeclineEmail(registrationRequest.email, registrationRequest.entityName, declineReason);
            console.log(`Sent decline email to ${registrationRequest.email}`);

            return NextResponse.json({ message: 'Request declined' });
        }
    } catch (error) {
        console.error('Error processing registration request:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
