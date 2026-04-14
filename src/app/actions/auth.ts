"use server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, verifySession } from "@/lib/session";
import { readUsers, writeUsers } from "@/lib/db";

// Block common injection patterns
const INJECTION_PATTERN = /(['";\\]|--|\/\*|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i;

function sanitize(input: string): string {
  return input.trim().slice(0, 128);
}

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const username = sanitize(formData.get("username") as string ?? "");
  const password = sanitize(formData.get("password") as string ?? "");

  if (!username || !password) return { error: "Username and password required." };
  if (INJECTION_PATTERN.test(username) || INJECTION_PATTERN.test(password)) {
    return { error: "Invalid input detected." };
  }

  const users = readUsers();
  const user = users[username];
  if (!user) return { error: "Invalid credentials." };

  const inputHash = crypto.createHash("sha256").update(password).digest("hex");

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(user.hash, "hex"),
      Buffer.from(inputHash, "hex")
    );
  } catch {
    return { error: "Invalid credentials." };
  }

  if (!valid) return { error: "Invalid credentials." };

  const token = await createSession(username, user.role);
  const jar = await cookies();
  jar.set("ptts-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 60 minutes
    path: "/",
  });

  redirect("/dashboard");
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
  // Verify admin authorization
  const jar = await cookies();
  const sessionToken = jar.get("ptts-session")?.value;

  if (!sessionToken) {
    return { success: false, error: "Not authenticated." };
  }

  const session = await verifySession(sessionToken);
  if (!session || session.role !== "admin") {
    return { success: false, error: "Admin access required." };
  }

  // Extract and sanitize input
  const username = sanitize(formData.get("username") as string ?? "");
  const password = sanitize(formData.get("password") as string ?? "");
  const role = sanitize(formData.get("role") as string ?? "operator");

  // Validate input
  if (!username || !password) {
    return { success: false, error: "Username and password required." };
  }

  if (username.length < 3) {
    return { success: false, error: "Username must be at least 3 characters." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  if (INJECTION_PATTERN.test(username) || INJECTION_PATTERN.test(password)) {
    return { success: false, error: "Invalid input detected." };
  }

  if (!["admin", "operator", "engineer"].includes(role)) {
    return { success: false, error: "Invalid role." };
  }

  // Check if user already exists
  const users = readUsers();
  if (users[username]) {
    return { success: false, error: "Username already exists." };
  }

  // Create password hash
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  // Add user to persistent store
  users[username] = { hash, role };
  writeUsers(users);

  return { success: true };
}

export async function fetchUsersAction(): Promise<
  { success: boolean; users?: Array<{ username: string; hash: string; role: string }>; error?: string }
> {
  // Verify admin authorization
  const jar = await cookies();
  const sessionToken = jar.get("ptts-session")?.value;

  if (!sessionToken) {
    return { success: false, error: "Not authenticated." };
  }

  const session = await verifySession(sessionToken);
  if (!session || session.role !== "admin") {
    return { success: false, error: "Admin access required." };
  }

  const usersMap = readUsers();
  // Return all users
  const users = Object.entries(usersMap).map(([username, data]) => ({
    username,
    hash: data.hash,
    role: data.role,
  }));

  return { success: true, users };
}

export async function getCurrentSessionAction(): Promise<
  { success: boolean; username?: string; role?: string; error?: string }
> {
  const jar = await cookies();
  const sessionToken = jar.get("ptts-session")?.value;

  if (!sessionToken) {
    return { success: false, error: "Not authenticated." };
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return { success: false, error: "Invalid session." };
  }

  return { success: true, username: session.username as string, role: session.role as string };
}
