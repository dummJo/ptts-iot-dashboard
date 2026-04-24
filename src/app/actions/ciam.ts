"use server";
import { getDynamicBearerToken } from "@/services/identityService";
import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";

/**
 * CIAM MANUAL SYNC ACTION
 * Purpose: Manually triggers a fresh identity handshake with ABB CIAM.
 */
export async function syncCiamAction() {
  try {
    const jar = await cookies();
    const sessionToken = jar.get("ptts-session")?.value;

    if (!sessionToken) return { success: false, error: "Authentication required." };
    
    const session = await verifySession(sessionToken);
    if (!session) return { success: false, error: "Invalid dashboard session." };

    console.log(`[CIAM ACTION] Manual sync initiated by: ${session.username}`);
    console.log(`[DEBUG ENV] ABB_USERNAME present: ${!!process.env.ABB_USERNAME}`);
    console.log(`[DEBUG ENV] ABB_PASSWORD present: ${!!process.env.ABB_PASSWORD}`);

    // Force discovery by calling the identity service directly
    const token = await getDynamicBearerToken();
    
    if (token) {
      console.log(`[CIAM ACTION] Manual sync successful.`);
      return { success: true, message: "CIAM Connection Restored." };
    }
    
    return { success: false, error: "Failed to obtain token from pool." };
  } catch (err: any) {
    console.error("[CIAM ACTION] Sync error:", err.message);
    return { success: false, error: err.message || "CIAM Handshake Failed" };
  }
}
