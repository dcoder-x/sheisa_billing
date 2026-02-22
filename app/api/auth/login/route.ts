import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password, domain } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // --- TENANT LOGIN (subdomain present) ---
    if (domain) {
      // Look up the entity by subdomain
      const entity = await prisma.entity.findUnique({
        where: { subdomain: domain },
      });

      if (!entity) {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Find user scoped to this entity
      const user = await prisma.user.findFirst({
        where: {
          email,
          entityId: entity.id,
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (user.status === 'SUSPENDED') {
        return NextResponse.json(
          { message: 'Your account has been suspended. Please contact your administrator.' },
          { status: 403 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      await createSession({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        entityId: user.entityId || undefined,
        status: user.status,
        forcePasswordReset: user.forcePasswordReset,
      });

      return NextResponse.json({ success: true });
    }

    // --- SUPER ADMIN LOGIN (no domain / main site) ---
    // Find a user with SUPER_ADMIN role and no entityId
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: 'SUPER_ADMIN',
        entityId: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      entityId: undefined,
      status: user.status,
      forcePasswordReset: user.forcePasswordReset,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
