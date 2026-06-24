import { prisma } from "@/lib/prisma";
import { branchDisplayName } from "@/lib/branches";
import { NUMERIC_FIELDS } from "@/lib/fields";
import { isCourseType } from "@/lib/enums";

export type ImportItem = {
  branchId?: string;
  slug?: string;
  branch?: string; // branch name (sheet-friendly)
  period: string;
  notes?: string;
  nationalities?: { name: string; count: number }[];
  courses?: { name: string; type: string; count: number }[];
} & Record<string, unknown>;

const clamp = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Upsert monthly reports from an array of rows. Resolves the branch by id,
 * slug, or name. Used by the admin JSON import AND the Google Sheets API.
 * No auth here — callers must authorize.
 */
export async function applyImport(items: ImportItem[]) {
  if (!Array.isArray(items)) throw new Error("صيغة غير صحيحة");

  const branches = await prisma.branch.findMany();
  const bySlug = new Map(branches.map((b) => [b.slug, b.id]));
  const byName = new Map(
    branches.flatMap((b) => [
      [b.name.trim(), b.id],
      [branchDisplayName(b).trim(), b.id],
    ]),
  );
  const byNameLower = new Map(
    branches.flatMap((b) => [
      [b.name.trim().toLowerCase(), b.id],
      [branchDisplayName(b).trim().toLowerCase(), b.id],
    ]),
  );

  let imported = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const period = String(item.period || "").trim();
      let branchId =
        item.branchId ||
        (item.slug ? bySlug.get(item.slug.trim()) : undefined) ||
        (item.branch ? byName.get(item.branch.trim()) : undefined) ||
        (item.branch
          ? byNameLower.get(item.branch.trim().toLowerCase())
          : undefined);

      if (!branchId) {
        errors.push(`فرع غير معروف: ${item.branch ?? item.slug ?? "?"}`);
        continue;
      }
      if (!PERIOD_RE.test(period)) {
        errors.push(`فترة غير صحيحة (YYYY-MM): ${period}`);
        continue;
      }

      const numbers: Record<string, number> = {};
      for (const k of NUMERIC_FIELDS) numbers[k] = clamp(item[k]);
      const notes = String(item.notes ?? "").trim();

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
          where: { branchId_period: { branchId: branchId!, period } },
          update: { ...numbers, notes },
          create: { branchId: branchId!, period, ...numbers, notes },
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

  return { ok: true, imported, errors };
}
