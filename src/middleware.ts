import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "ptts-iot-secure-default-change-in-production-2026"
);

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("ptts-session")?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.includes(pathname);

  let isSessionValid = false;

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, SECRET);
      isSessionValid = true;
    } catch {
      isSessionValid = false;
    }
  }

  // Redirect unauthenticated users to login if they try to access protected routes
  if (!isSessionValid && !isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from the login page
  if (isSessionValid && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect root to dashboard (if authenticated) or login (if unauthenticated)
  if (pathname === "/") {
    return NextResponse.redirect(new URL(isSessionValid ? "/dashboard" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, they handle their own authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any files with standard static extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
