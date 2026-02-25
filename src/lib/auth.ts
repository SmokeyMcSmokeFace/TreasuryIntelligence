import { SignJWT, jwtVerify } from "jose";
import { createHash, timingSafeEqual } from "crypto";

const COOKIE_NAME = "tip_session";
const SESSION_DURATION = "24h";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

// Timing-safe password comparison (hashes first so lengths don't leak)
export function checkPassword(input: string, stored: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(stored).digest();
  return timingSafeEqual(a, b);
}

export function checkEmail(input: string, stored: string): boolean {
  const a = createHash("sha256").update(input.toLowerCase()).digest();
  const b = createHash("sha256").update(stored.toLowerCase()).digest();
  return timingSafeEqual(a, b);
}

export { COOKIE_NAME };
