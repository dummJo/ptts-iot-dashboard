import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

// ⚡ INDUSTRIAL UPGRADE: Signing key is derived using Scrypt for maximum resistance
const AUTH_SECRET = process.env.AUTH_SECRET ?? "ptts-iot-secure-default-2026";
const SALT = process.env.AUTH_SALT || "ptts-salt-2024";
const SECRET = crypto.scryptSync(AUTH_SECRET, SALT, 32);

export async function createSession(username: string, role: string): Promise<string> {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60m")
    .sign(SECRET);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}
