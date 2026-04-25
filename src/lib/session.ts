import { SignJWT, jwtVerify } from "jose";

// ⚡ INDUSTRIAL UPGRADE: Signing key is based on AUTH_SECRET.
// We use TextEncoder to ensure cross-platform compatibility (Node.js & Edge Runtime).
const AUTH_SECRET = process.env.AUTH_SECRET ?? "ptts-iot-secure-default-2026";
const SECRET = new TextEncoder().encode(AUTH_SECRET);

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
