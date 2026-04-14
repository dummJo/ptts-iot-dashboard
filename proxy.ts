import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ptts-session")?.value;

  // Paths that exist in our app
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";

  // If navigating to an unknown path (e.g. /, /random), redirect to dashboard
  if (!isDashboardRoute && !isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Dashboard route protection
  if (isDashboardRoute) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const session = await verifySession(token);
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
  }

  // Login route logic (skip login if already authed)
  if (isLoginRoute && token) {
    const session = await verifySession(token);
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
