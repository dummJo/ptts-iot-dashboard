"use server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

// SHA-256 hash of "admin" — replace with DB lookup + bcrypt in production
const USERS: Record<string, string> = {
  admin: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
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

  const storedHash = USERS[username];
  if (!storedHash) return { error: "Invalid credentials." };

  const inputHash = crypto.createHash("sha256").update(password).digest("hex");

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(storedHash, "hex"),
      Buffer.from(inputHash, "hex")
    );
  } catch {
    return { error: "Invalid credentials." };
  }

  if (!valid) return { error: "Invalid credentials." };

  const token = await createSession(username);
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
