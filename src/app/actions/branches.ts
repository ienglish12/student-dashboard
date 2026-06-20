"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NUMERIC_FIELDS } from "@/lib/fields";
import { isCourseType } from "@/lib/enums";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("غير مصرّح");
  return session;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^\w؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "branch"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createBranch(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("اسم الفرع مطلوب");
  await prisma.branch.create({ data: { name: trimmed, slug: slugify(trimmed) } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateBranch(id: string, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("اسم الفرع مطلوب");
  await prisma.branch.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteBranch(id: string) {
  await requireAdmin();
  // Remove dependent reports (and their cascaded children) first.
  await prisma.monthlyReport.deleteMany({ where: { branchId: id } });
  await prisma.user.updateMany({
    where: { branchId: id },
    data: { branchId: null },
  });
  await prisma.branch.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true };
}

const clamp = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

type ImportItem = {
  branchId?: string;
  slug?: string;
  period: string;
  nationalities?: { name: string; count: number }[];
  courses?: { name: string; type: string; count: number }[];
} & Record<string, unknown>;

/** Upsert reports from a JSON array matching the export shape (SPEC §6/§7). */
export async function importReports(items: ImportItem[]) {
  await requireAdmin();
  if (!Array.isArray(items)) throw new Error("صيغة الملف غير صحيحة");

  let imported = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      // Resolve branch by id or slug.
      let branchId = item.branchId;
      if (!branchId && item.slug) {
        const b = await prisma.branch.findUnique({ where: { slug: item.slug } });
        branchId = b?.id;
      }
      if (!branchId || !item.period) {
        errors.push(`سجل بدون فرع/فترة تم تخطيه`);
        continue;
      }

      const numbers: Record<string, number> = {};
      for (const k of NUMERIC_FIELDS) numbers[k] = clamp(item[k]);

      const nationalities = (item.nationalities ?? [])
        .map((n) => ({ name: String(n.name).trim(), count: clamp(n.count) }))
        .filter((n) => n.name);
      const courses = (item.courses ?? [])
        .map((c) => ({
          name: String(c.name).trim(),
          type: isCourseType(c.type) ? c.type : "OTHER",
          count: clamp(c.count),
        }))
        .filter((c) => c.name);

      await prisma.$transaction(async (tx) => {
        const report = await tx.monthlyReport.upsert({
          where: { branchId_period: { branchId: branchId!, period: item.period } },
          update: numbers,
          create: { branchId: branchId!, period: item.period, ...numbers },
        });
        await tx.nationality.deleteMany({ where: { reportId: report.id } });
        await tx.course.deleteMany({ where: { reportId: report.id } });
        if (nationalities.length)
          await tx.nationality.createMany({
            data: nationalities.map((n) => ({ ...n, reportId: report.id })),
          });
        if (courses.length)
          await tx.course.createMany({
            data: courses.map((c) => ({ ...c, reportId: report.id })),
          });
      });
      imported++;
    } catch {
      errors.push("فشل استيراد أحد السجلات");
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true, imported, errors };
}

/** Danger zone: wipe all reports + their children (SPEC §6). */
export async function wipeAllData() {
  await requireAdmin();
  await prisma.$transaction([
    prisma.nationality.deleteMany({}),
    prisma.course.deleteMany({}),
    prisma.monthlyReport.deleteMany({}),
  ]);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true };
}
