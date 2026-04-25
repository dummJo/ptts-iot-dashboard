import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

/**
 * PTTS INDUSTRIAL-GRADE SECURITY PROXY (v3.0 - #GODMODE)
 * 
 * SECURITY LAYERS:
 * 1. CRYPTOGRAPHIC VERIFICATION: JWT session validation using HS256/RS256.
 * 2. CSP ENFORCEMENT: Content Security Policy to prevent XSS/Injection.
 * 3. TRANSPORT HARDENING: HSTS and No-Sniff headers.
 * 4. FRAME PROTECTION: Prevents Clickjacking via DENY policy.
 */
export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('ptts-session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = pathname === '/login' || pathname.startsWith('/api/auth');
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname === '/';

  // ── LAYER 1: AUTHENTICATION ENFORCEMENT ────────────────────────────────────
  if (isDashboardRoute) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Deep Verification: Don't just trust the cookie existence, verify the signature
    const session = await verifySession(sessionToken);
    if (!session) {
      console.warn(`[SECURITY] Invalid/Expired session attempt at ${pathname}. Redirecting.`);
      const response = NextResponse.redirect(new URL('/login?reason=expired', request.url));
      response.cookies.delete('ptts-session');
      return response;
    }
  }

  // ── LAYER 2: SECURITY HEADERS (HARDENING) ──────────────────────────────────
  const response = NextResponse.next();

  // Content Security Policy (Strict but allows ABB/Neon domains)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://www.ptts.co.id https://powertrain.abb.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
