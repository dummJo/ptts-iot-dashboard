import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * PTTS SECURITY MIDDLEWARE
 * Purpose: Enforces authentication across all dashboard routes.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get('ptts-session')?.value;
  const { pathname } = request.nextUrl;

  // 1. Define public routes
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/api/auth');
  
  // 2. Redirect unauthenticated users to login
  if (!session && !isPublicRoute && pathname.startsWith('/dashboard')) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // 3. Redirect authenticated users away from login
  if (session && pathname === '/login') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Ensure middleware only runs on relevant routes to optimize performance
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/',
  ],
};
