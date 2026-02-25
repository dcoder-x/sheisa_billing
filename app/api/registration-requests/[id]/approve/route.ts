import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: id },
    });

    if (!registrationRequest) {
      return NextResponse.json(
        { message: 'Registration request not found' },
        { status: 404 }
      );
    }

    // Create entity
    const entity = await prisma.entity.create({
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

    // Create user for the entity
    const user = await prisma.user.create({
      data: {
        email: registrationRequest.email,
        password: registrationRequest.password,
        fullName: registrationRequest.entityName,
        role: 'ENTITY_USER',
        entityId: entity.id,
      },
    });

    // Update registration request
    await prisma.registrationRequest.update({
      where: { id: id },
      data: {
        status: 'APPROVED',
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Registration approved successfully',
      entity,
      user,
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
