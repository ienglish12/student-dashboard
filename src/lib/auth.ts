import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

const COOKIE_NAME = "ienglish_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  userId: string;
  role: Role;
  branchId: string | null;
};

async function encrypt(payload: SessionPayload, remember: boolean) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(remember ? "7d" : "1d")
    .sign(secret());
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      branchId: (payload.branchId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Check email + password. Returns the user identity (no cookie set) or null. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ userId: string; role: Role; branchId: string | null; email: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    userId: user.id,
    role: user.role as Role,
    branchId: user.branchId,
    email: user.email,
  };
}

/** Set the session cookie for an already-verified identity. */
export async function createSession(payload: SessionPayload, remember = false) {
  const token = await encrypt(payload, remember);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? MAX_AGE : undefined,
  });
}

export async function logout() {
  (await cookies()).delete(COOKIE_NAME);
}

/** Full user record for the current session (or null). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { branch: true },
  });
}

/** Throws-redirect helpers are kept in route/layout code; these just assert. */
export function isAdmin(session: SessionPayload | null) {
  return session?.role === "ADMIN";
}

/** Server-side branch access check (SPEC §7). */
export function canAccessBranch(
  session: SessionPayload | null,
  branchId: string,
) {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  return session.branchId === branchId;
}
