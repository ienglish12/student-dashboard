"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRole } from "@/lib/enums";
import { validatePassword } from "@/lib/password";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("غير مصرّح");
  return session;
}

export type CreateUserInput = {
  email: string;
  password: string;
  role: string; // "ADMIN" | "BRANCH"
  branchId?: string | null;
};

export async function createUser(input: CreateUserInput) {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("بريد إلكتروني غير صحيح");
  const pwErr = validatePassword(input.password);
  if (pwErr) throw new Error(pwErr);
  const role = isRole(input.role) ? input.role : "BRANCH";
  const branchId = role === "BRANCH" ? input.branchId || null : null;
  if (role === "BRANCH" && !branchId)
    throw new Error("لازم تختار فرعًا لمستخدم الفرع");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("الإيميل ده مستخدم بالفعل");

  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: { email, passwordHash, role, branchId },
  });

  revalidatePath("/settings");
  return { ok: true };
}

/** Reset an existing user's password. */
export async function resetUserPassword(id: string, password: string) {
  await requireAdmin();
  const pwErr = validatePassword(password);
  if (pwErr) throw new Error(pwErr);
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/settings");
  return { ok: true };
}

/** Public: a user requests a password reset (admin fulfills it). */
export async function requestPasswordReset(email: string) {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) {
    return { ok: false as const, error: "بريد إلكتروني غير صحيح" };
  }
  // Only record a request if the account exists (silently succeed either way).
  const user = await prisma.user.findUnique({ where: { email: clean } });
  if (user) {
    await prisma.passwordResetRequest.create({ data: { email: clean } });
  }
  revalidatePath("/settings");
  return { ok: true as const };
}

/** Admin: set a new password for the request's user and mark it resolved. */
export async function resolveResetRequest(id: string, password: string) {
  await requireAdmin();
  const pwErr = validatePassword(password);
  if (pwErr) throw new Error(pwErr);
  const req = await prisma.passwordResetRequest.findUnique({ where: { id } });
  if (!req) throw new Error("الطلب غير موجود");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email: req.email },
    data: { passwordHash },
  });
  await prisma.passwordResetRequest.update({
    where: { id },
    data: { resolved: true },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function dismissResetRequest(id: string) {
  await requireAdmin();
  await prisma.passwordResetRequest.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true };
}

/** Self-service: the signed-in user updates their own email and/or password. */
export async function updateMyAccount(input: {
  email?: string;
  currentPassword: string;
  newPassword?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرّح");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("الحساب غير موجود");

  // Any change requires confirming the current password.
  const ok = await bcrypt.compare(input.currentPassword ?? "", user.passwordHash);
  if (!ok) throw new Error("كلمة المرور الحالية غير صحيحة");

  const data: { email?: string; passwordHash?: string } = {};

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("بريد إلكتروني غير صحيح");
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error("الإيميل ده مستخدم بالفعل");
      data.email = email;
    }
  }

  if (input.newPassword) {
    const pwErr = validatePassword(input.newPassword);
    if (pwErr) throw new Error(pwErr);
    data.passwordHash = await bcrypt.hash(input.newPassword, 10);
  }

  if (Object.keys(data).length === 0) return { ok: true as const };

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.userId === id)
    throw new Error("مش ممكن تحذف حسابك الحالي");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true };
}
