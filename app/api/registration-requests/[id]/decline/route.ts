import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { message: 'Decline reason is required' },
        { status: 400 }
      );
    }

    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: params.id },
    });

    if (!registrationRequest) {
      return NextResponse.json(
        { message: 'Registration request not found' },
        { status: 404 }
      );
    }

    // Update registration request
    await prisma.registrationRequest.update({
      where: { id: params.id },
      data: {
        status: 'DECLINED',
        declineReason: reason,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Registration declined successfully',
    });
  } catch (error) {
    console.error('Error declining registration:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
