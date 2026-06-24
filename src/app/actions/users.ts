"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRole } from "@/lib/enums";
import { validatePassword } from "@/lib/password";
import { emailEnabled, sendEmail, codeEmailHtml } from "@/lib/email";
import {
  generateCode,
  hashCode,
  setResetChallenge,
  readResetChallenge,
  clearResetChallenge,
} from "@/lib/otp";

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

export async function createUser(
  input: CreateUserInput,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@"))
    return { ok: false, error: "بريد إلكتروني غير صحيح" };
  const pwErr = validatePassword(input.password);
  if (pwErr) return { ok: false, error: pwErr };
  const role = isRole(input.role) ? input.role : "BRANCH";
  const branchId = role === "BRANCH" ? input.branchId || null : null;
  if (role === "BRANCH" && !branchId)
    return { ok: false, error: "لازم تختار فرعًا لمستخدم الفرع" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "الإيميل ده مستخدم بالفعل" };

  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: { email, passwordHash, role, branchId },
  });

  revalidatePath("/settings");
  return { ok: true };
}

/** Reset an existing user's password. */
export async function resetUserPassword(
  id: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Public: start a password reset.
 * - Admin (with email configured): emails a verification code → "code" flow.
 * - Everyone else: records a request the admin fulfills → "manual" flow.
 * Never reveals whether an account exists.
 */
export async function startPasswordReset(
  email: string,
): Promise<{ ok: boolean; mode: "code" | "manual"; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) {
    return { ok: false, mode: "manual", error: "بريد إلكتروني غير صحيح" };
  }

  const user = await prisma.user.findUnique({ where: { email: clean } });

  // Self-service code reset is reserved for admins (the only mailbox the
  // owner controls in the current setup).
  if (user && user.role === "ADMIN" && emailEnabled()) {
    try {
      const code = generateCode();
      await sendEmail(
        clean,
        "إعادة تعيين كلمة المرور — iEnglish",
        codeEmailHtml(code, "reset"),
      );
      await setResetChallenge(clean, code);
      return { ok: true, mode: "code" };
    } catch {
      // fall through to the manual path
    }
  }

  // Staff (or email unavailable): admin fulfills the request manually.
  if (user) {
    await prisma.passwordResetRequest.create({ data: { email: clean } });
    revalidatePath("/settings");
  }
  return { ok: true, mode: "manual" };
}

/** Public: complete the admin code reset by verifying the emailed code. */
export async function completePasswordReset(
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const ch = await readResetChallenge();
  if (!ch) return { ok: false, error: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." };
  if (!code || hashCode(code.trim(), ch.email) !== ch.codeHash) {
    return { ok: false, error: "الرمز غير صحيح." };
  }
  const pwErr = validatePassword(newPassword);
  if (pwErr) return { ok: false, error: pwErr };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email: ch.email },
    data: { passwordHash },
  });
  await clearResetChallenge();
  return { ok: true };
}

/** Admin: set a new password for the request's user and mark it resolved. */
export async function resolveResetRequest(
  id: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };
  const req = await prisma.passwordResetRequest.findUnique({ where: { id } });
  if (!req) return { ok: false, error: "الطلب غير موجود" };
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
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "غير مصرّح" };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { ok: false, error: "الحساب غير موجود" };

  // Any change requires confirming the current password.
  const ok = await bcrypt.compare(input.currentPassword ?? "", user.passwordHash);
  if (!ok) return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };

  const data: { email?: string; passwordHash?: string } = {};

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@"))
      return { ok: false, error: "بريد إلكتروني غير صحيح" };
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return { ok: false, error: "الإيميل ده مستخدم بالفعل" };
      data.email = email;
    }
  }

  if (input.newPassword) {
    const pwErr = validatePassword(input.newPassword);
    if (pwErr) return { ok: false, error: pwErr };
    data.passwordHash = await bcrypt.hash(input.newPassword, 10);
  }

  if (Object.keys(data).length === 0) return { ok: true };

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.userId === id)
    throw new Error("مش ممكن تحذف حسابك الحالي");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true };
}
