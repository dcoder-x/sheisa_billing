import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-key-change-in-production'
);

export interface Session {
  userId: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ENTITY_ADMIN' | 'ENTITY_USER';
  entityId?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  forcePasswordReset?: boolean;
}

export async function createSession(session: Session) {
  const token = await new SignJWT(session as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as Session;
  } catch (err) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as Session;
  } catch (err) {
    return null;
  }
}
