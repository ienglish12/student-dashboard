"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isCourseType } from "@/lib/enums";
import { applyImport } from "@/lib/import";

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
  const res = await applyImport(items as Parameters<typeof applyImport>[0]);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return res;
}

/** Import a per-student roster CSV for one branch (auto-aggregates by month). */
export async function importStudentSheet(
  branchId: string,
  csv: string,
  filename = "roster.csv",
) {
  await requireAdmin();
  if (!branchId) throw new Error("اختر الفرع أولاً");
  const { aggregateStudentCsv } = await import("@/lib/student-csv");
  const { rows, totalStudents, skipped } = aggregateStudentCsv(csv);
  if (rows.length === 0) {
    return { ok: false, totalStudents: 0, skipped, periods: [] as string[], imported: 0 };
  }
  const items = rows.map((r) => ({
    branchId,
    period: r.period,
    ...r.numbers,
    nationalities: r.nationalities,
    courses: r.courses,
  }));
  const res = await applyImport(items as Parameters<typeof applyImport>[0]);

  // Keep the raw file per (branch, period) so it can be reviewed/downloaded.
  for (const r of rows) {
    const count = r.numbers.male + r.numbers.female;
    await prisma.upload.deleteMany({ where: { branchId, period: r.period } });
    await prisma.upload.create({
      data: { branchId, period: r.period, filename, studentCount: count, content: csv },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/settings");
  return {
    ok: true,
    totalStudents,
    skipped,
    periods: rows.map((r) => r.period),
    imported: res.imported,
  };
}

// ---- Form presets (admin-managed defaults shown in the branch form) ----

export async function addNationalityPreset(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("الاسم مطلوب");
  const count = await prisma.nationalityPreset.count();
  await prisma.nationalityPreset.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed, order: count },
  });
  revalidatePath("/settings");
  revalidatePath("/entry");
  return { ok: true };
}

export async function removeNationalityPreset(id: string) {
  await requireAdmin();
  await prisma.nationalityPreset.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/entry");
  return { ok: true };
}

export async function addCoursePreset(name: string, type: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("الاسم مطلوب");
  const safeType = isCourseType(type) ? type : "OTHER";
  const count = await prisma.coursePreset.count();
  await prisma.coursePreset.upsert({
    where: { name: trimmed },
    update: { type: safeType },
    create: { name: trimmed, type: safeType, order: count },
  });
  revalidatePath("/settings");
  revalidatePath("/entry");
  return { ok: true };
}

export async function removeCoursePreset(id: string) {
  await requireAdmin();
  await prisma.coursePreset.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/entry");
  return { ok: true };
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
