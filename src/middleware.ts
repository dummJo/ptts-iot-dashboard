import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ptts-session")?.value;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";
  const isRoot = pathname === "/";

  // 1. Handle Root Path - Redirect based on auth status
  if (isRoot) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const session = await verifySession(token);
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Dashboard Protection (MUST be logged in)
  if (isDashboardRoute) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const session = await verifySession(token) as { role: string } | null;
    
    // If token is invalid or expired
    if (!session) {
      const resp = NextResponse.redirect(new URL("/login?reason=inactivity", req.url));
      resp.cookies.delete("ptts-session");
      return resp;
    }

    // Role-Based Access Control (RBAC)
    // Only 'admin' can access /dashboard/settings
    if (pathname.includes("/settings") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 3. Login Page Logic (If already logged in, skip login)
  if (isLoginRoute && token) {
    const session = await verifySession(token);
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - static files (_next/static, _next/image, favicon.ico)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
