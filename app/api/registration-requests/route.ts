import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const requests = await prisma.registrationRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        entityName: true,
        registrationNumber: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        businessType: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
