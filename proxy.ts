import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ptts-session")?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const session = await verifySession(token);
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && token) {
    const session = await verifySession(token);
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
