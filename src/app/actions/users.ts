"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRole } from "@/lib/enums";

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
  if (!input.password || input.password.length < 6)
    throw new Error("كلمة المرور لازم تكون 6 أحرف على الأقل");
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
  if (!password || password.length < 6)
    throw new Error("كلمة المرور لازم تكون 6 أحرف على الأقل");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
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
