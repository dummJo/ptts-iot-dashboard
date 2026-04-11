"use server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, verifySession } from "@/lib/session";

// SHA-256 hashes — replace with DB lookup + bcrypt in production
const USERS: Record<string, { hash: string; role: string }> = {
  admin:    { hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", role: "admin" },
  operator: { hash: "06e55b633481f7bb072957eabcf110c972e86691c3cfedabe088024bffe42f23", role: "operator" },
  engineer: { hash: "7826b958b79c70626801b880405eb5111557dadceb2fee2b1ed69a18eed0c6dc", role: "engineer" },
};

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

  const user = USERS[username];
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
  if (USERS[username]) {
    return { success: false, error: "Username already exists." };
  }

  // Create password hash
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  // Add user to USERS object
  USERS[username] = { hash, role };

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

  // Return all users
  const users = Object.entries(USERS).map(([username, data]) => ({
    username,
    hash: data.hash,
    role: data.role,
  }));

  return { success: true, users };
}
