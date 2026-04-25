import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for static assets, public files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // matches favicon.ico, images, etc.
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("ptts-session")?.value;
  const isLoginRoute = pathname === "/login";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isRoot = pathname === "/";

  // 2. Handle Root Path - Direct to Login or Dashboard
  if (isRoot) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const session = await verifySession(token);
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Protect Dashboard Routes
  if (isDashboardRoute) {
    if (!token) {
      console.log("Middleware: No token found for dashboard route, redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    const session = await verifySession(token) as { role: string } | null;
    
    if (!session) {
      console.log("Middleware: Invalid/Expired session, clearing cookie and redirecting");
      const resp = NextResponse.redirect(new URL("/login?reason=expired", req.url));
      resp.cookies.delete("ptts-session");
      return resp;
    }

    // Role-Based Access Control (RBAC) Logic
    if (pathname.includes("/settings") && session.role !== "admin") {
      console.log(`Middleware: Role ${session.role} unauthorized for /settings`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 4. Prevent Authenticated users from seeing Login page
  if (isLoginRoute && token) {
    const session = await verifySession(token);
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// Remove the matcher to ensure the function runs on EVERY request, 
// and handle filtering manually inside the function for maximum reliability.
export const config = {
  matcher: ['/:path*'], 
};
