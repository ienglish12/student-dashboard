import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomInt } from "crypto";
import type { Role } from "@/lib/enums";

// Stateless one-time codes: the (hashed) code lives in a short-lived signed,
// httpOnly cookie — no database table needed.

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

const RESET_COOKIE = "ienglish_reset";
const TWOFA_COOKIE = "ienglish_2fa";

export type ResetChallenge = { email: string; codeHash: string };
export type TwoFAChallenge = {
  userId: string;
  role: Role;
  branchId: string | null;
  email: string;
  remember: boolean;
  codeHash: string;
};

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string, salt: string): string {
  return createHash("sha256")
    .update(`${code}:${salt}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

async function setChallenge(name: string, payload: object, ttlSeconds: number) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret());
  (await cookies()).set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds,
  });
}

async function readChallenge<T>(name: string): Promise<T | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export async function setResetChallenge(email: string, code: string) {
  await setChallenge(RESET_COOKIE, { email, codeHash: hashCode(code, email) }, 15 * 60);
}
export async function readResetChallenge() {
  return readChallenge<ResetChallenge>(RESET_COOKIE);
}
export async function clearResetChallenge() {
  (await cookies()).delete(RESET_COOKIE);
}

export async function setTwoFAChallenge(
  data: Omit<TwoFAChallenge, "codeHash">,
  code: string,
) {
  await setChallenge(
    TWOFA_COOKIE,
    { ...data, codeHash: hashCode(code, data.email) },
    10 * 60,
  );
}
export async function readTwoFAChallenge() {
  return readChallenge<TwoFAChallenge>(TWOFA_COOKIE);
}
export async function clearTwoFAChallenge() {
  (await cookies()).delete(TWOFA_COOKIE);
}
