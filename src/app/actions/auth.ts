"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, verifySession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/security";

// Block common injection patterns
const INJECTION_PATTERN = /(['";\\]|--|\/\*|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i;

function sanitize(input: string): string {
  return input.trim().slice(0, 128);
}

export async function loginAction(
  _prev: { error?: string, success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string, success?: boolean } | null> {
  try {
    const username = sanitize(formData.get("username") as string ?? "");
    const password = sanitize(formData.get("password") as string ?? "");

    if (!username || !password) return { error: "Username and password required." };
    if (INJECTION_PATTERN.test(username) || INJECTION_PATTERN.test(password)) {
      return { error: "Invalid input detected." };
    }

    // Find user in PostgreSQL via Prisma
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) return { error: "Invalid credentials." };

    // ⚡ INDUSTRIAL UPGRADE: Using specialized security utility with Scrypt & SHA-256 fallback
    if (!verifyPassword(password, user.passwordHash)) {
      return { error: "Invalid credentials." };
    }

    // Gracefully migrate legacy SHA256 hashes to Scrypt upon successful login
    if (user.passwordHash.length === 64) {
        await prisma.user.update({
            where: { username },
            data: { passwordHash: hashPassword(password) }
        });
    }

    const token = await createSession(username, user.role);
    const jar = await cookies();
    jar.set("ptts-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && process.env.HTTPS_ONLY === "true", // Disabled by default for local IoT network access
      sameSite: "lax",
      maxAge: 60 * 60, // 60 minutes
      path: "/",
    });
    
    return { success: true };
  } catch (err: any) {
    console.error("Login Error:", err);
    return { error: "Internal Error: " + (err.message || String(err)) };
  }
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete("ptts-session");
  redirect("/login");
}

export async function autoLogoutAction() {
  const jar = await cookies();
  jar.delete("ptts-session");
  redirect("/login?reason=inactivity");
}

export async function createUserAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const jar = await cookies();
  const sessionToken = jar.get("ptts-session")?.value;

  if (!sessionToken) return { success: false, error: "Not authenticated." };

  const session = await verifySession(sessionToken);
  if (!session || session.role !== "admin") {
    return { success: false, error: "Admin access required." };
  }

  const username = sanitize(formData.get("username") as string ?? "");
  const password = sanitize(formData.get("password") as string ?? "");
  const role = sanitize(formData.get("role") as string ?? "operator");

  if (!username || !password) return { success: false, error: "Username and password required." };
  if (username.length < 3) return { success: false, error: "Username must be at least 3 characters." };
  if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };

  if (INJECTION_PATTERN.test(username) || INJECTION_PATTERN.test(password)) {
    return { success: false, error: "Invalid input detected." };
  }

  try {
    const hash = hashPassword(password);
    await prisma.user.create({
      data: { username, passwordHash: hash, role }
    });
    return { success: true };
  } catch (err: any) {
    if (err.code === 'P2002') return { success: false, error: "Username already exists." };
    return { success: false, error: "Failed to create user." };
  }
}

export async function fetchUsersAction(): Promise<
  { success: boolean; users?: Array<{ username: string; hash: string; role: string }>; error?: string }
> {
  const jar = await cookies();
  const sessionToken = jar.get("ptts-session")?.value;

  if (!sessionToken) return { success: false, error: "Not authenticated." };

  const session = await verifySession(sessionToken);
  if (!session || session.role !== "admin") {
    return { success: false, error: "Admin access required." };
  }

  try {
    const usersData = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const users = usersData.map(u => ({
      username: u.username,
      hash: u.passwordHash,
      role: u.role,
    }));

    return { success: true, users };
  } catch (err) {
    return { success: false, error: "Failed to fetch users." };
  }
}

export async function getCurrentSessionAction(): Promise<
  { success: boolean; username?: string; role?: string; error?: string }
> {
  const jar = await cookies();
  const sessionToken = jar.get("ptts-session")?.value;

  if (!sessionToken) return { success: false, error: "Not authenticated." };

  const session = await verifySession(sessionToken);
  if (!session) return { success: false, error: "Invalid session." };

  return { success: true, username: session.username as string, role: session.role as string };
}
