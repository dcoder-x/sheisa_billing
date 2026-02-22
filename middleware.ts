import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow ALL API routes to pass through without rewriting to tenant site
  // This ensures /api/analytics/entity hits app/api/analytics/entity/route.ts
  // regardless of the subdomain.
  // Allow ALL API routes and public uploads to pass through
  if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) {
    return NextResponse.next();
  }

  // Subdomain detection
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  const isSubdomain = subdomain && subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.includes(':');

  console.log(`[Middleware] Host: ${hostname}, Subdomain: ${subdomain}, Path: ${pathname}, IsSubdomain: ${isSubdomain}`);

  // Serve tenant site
  if (isSubdomain) {
    // Check if accessing public paths on subdomain
    const isPublicPath = pathname === '/login' || pathname.startsWith('/register');

    if (!isPublicPath) {
      const token = request.cookies.get('session')?.value;
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Validate the session belongs to this entity (prevent cross-tenant access)
      try {
        const { payload } = await jwtVerify(token, secret);
        const sessionEntityId = payload.entityId as string | undefined;

        // Fetch the entity for this subdomain to get its ID
        // We do a lightweight DB lookup here — entity lookups are cheap and this is critical for security
        const entityLookupUrl = new URL(`/api/auth/entity-by-subdomain?subdomain=${subdomain}`, request.url);
        const entityRes = await fetch(entityLookupUrl.toString(), {
          headers: { 'x-internal-auth': process.env.INTERNAL_API_SECRET || 'internal' }
        });

        if (entityRes.ok) {
          const entityData = await entityRes.json();
          if (entityData?.id && sessionEntityId !== entityData.id) {
            // Session belongs to a different entity — redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session');
            return response;
          }
        }
      } catch {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return NextResponse.rewrite(new URL(`/sites/${subdomain}${pathname}`, request.url));
  }

  // MAIN DOMAIN LOGIC

  // Allow login and register pages without authentication
  if (pathname === '/login' || pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  // Check for session token (Admin/Main App)
  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // RBAC
    if (pathname.startsWith('/admin') && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
