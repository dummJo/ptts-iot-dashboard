import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

/**
 * ⚡ INDUSTRIAL SECURITY LAYER (Defense in Depth)
 * This Server Component layout ensures that EVERY page under /dashboard 
 * is strictly protected by session verification, providing a 
 * bulletproof secondary barrier even if middleware is bypassed.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("ptts-session")?.value;

  // 1. Force back to login if no token is found
  if (!token) {
    redirect("/login");
  }

  // 2. Verify the JWT session integrity
  const session = await verifySession(token) as { role: string } | null;
  
  if (!session) {
    // Session is invalid or tampered with
    redirect("/login?reason=invalid");
  }

  // 3. Optional: Add a Global Role-Based Security header if needed
  // For now, we trust the middleware for granular RBAC, but the layout protects entry.

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {children}
    </div>
  );
}
