"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, canAccessBranch } from "@/lib/auth";
import { NUMERIC_FIELDS, type ReportNumbers } from "@/lib/fields";
import { isCourseType } from "@/lib/enums";

export type NationalityInput = { name: string; count: number };
export type CourseInput = { name: string; type: string; count: number };

export type SaveReportInput = {
  branchId: string;
  period: string;
  numbers: Partial<ReportNumbers>;
  nationalities: NationalityInput[];
  courses: CourseInput[];
};

const clamp = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Load a single branch's report for a period (with children). */
export async function getReport(branchId: string, period: string) {
  const session = await getSession();
  if (!session || !canAccessBranch(session, branchId)) {
    throw new Error("غير مصرّح");
  }
  return prisma.monthlyReport.findUnique({
    where: { branchId_period: { branchId, period } },
    include: { nationalities: true, courses: true },
  });
}

/** Upsert a report; child rows are fully replaced (SPEC §4). */
export async function saveReport(input: SaveReportInput) {
  const session = await getSession();
  if (!session || !canAccessBranch(session, input.branchId)) {
    throw new Error("غير مصرّح");
  }
  if (!PERIOD_RE.test(input.period)) {
    throw new Error("صيغة الفترة غير صحيحة (YYYY-MM)");
  }

  // Sanitize numeric fields (clamp negatives → 0).
  const numbers: Record<string, number> = {};
  for (const key of NUMERIC_FIELDS) {
    numbers[key] = clamp(input.numbers[key]);
  }

  // Drop empty-named child rows; clamp counts; validate course type.
  const nationalities = input.nationalities
    .map((n) => ({ name: n.name.trim(), count: clamp(n.count) }))
    .filter((n) => n.name.length > 0);

  const courses = input.courses
    .map((c) => ({
      name: c.name.trim(),
      type: isCourseType(c.type) ? c.type : "OTHER",
      count: clamp(c.count),
    }))
    .filter((c) => c.name.length > 0);

  await prisma.$transaction(async (tx) => {
    const report = await tx.monthlyReport.upsert({
      where: {
        branchId_period: { branchId: input.branchId, period: input.period },
      },
      update: numbers,
      create: { branchId: input.branchId, period: input.period, ...numbers },
    });

    await tx.nationality.deleteMany({ where: { reportId: report.id } });
    await tx.course.deleteMany({ where: { reportId: report.id } });

    if (nationalities.length) {
      await tx.nationality.createMany({
        data: nationalities.map((n) => ({ ...n, reportId: report.id })),
      });
    }
    if (courses.length) {
      await tx.course.createMany({
        data: courses.map((c) => ({ ...c, reportId: report.id })),
      });
    }
  });

  revalidatePath("/entry");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** All reports for a period (admin only) with branch + children. */
export async function listReports(period: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("غير مصرّح");
  }
  return prisma.monthlyReport.findMany({
    where: { period },
    include: { branch: true, nationalities: true, courses: true },
  });
}
