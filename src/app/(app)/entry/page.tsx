import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntryForm } from "./entry-form";
import { emptyNumbers, NUMERIC_FIELDS, type ReportNumbers } from "@/lib/fields";
import { branchDisplayName } from "@/lib/branches";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Data entry is for branch employees only — admins use the dashboard.
  if (user.role === "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const period = sp.period || currentPeriod();

  const branchId = user.branchId ?? undefined;
  if (!branchId) {
    return (
      <div className="p-10 text-center text-ink-soft">
        لا يوجد فرع مرتبط بهذا الحساب.
      </div>
    );
  }

  const [report, natPresets, coursePresets] = await Promise.all([
    prisma.monthlyReport.findUnique({
      where: { branchId_period: { branchId, period } },
      include: { nationalities: true, courses: true },
    }),
    prisma.nationalityPreset.findMany({ orderBy: { order: "asc" } }),
    prisma.coursePreset.findMany({ orderBy: { order: "asc" } }),
  ]);

  const numbers: ReportNumbers = emptyNumbers();
  if (report) {
    for (const k of NUMERIC_FIELDS) numbers[k] = report[k] as number;
  }

  return (
    <EntryForm
      branchId={branchId}
      branchName={user.branch ? branchDisplayName(user.branch) : ""}
      period={period}
      initialNumbers={numbers}
      initialNationalities={
        report && report.nationalities.length
          ? report.nationalities.map((n) => ({ name: n.name, count: n.count }))
          : natPresets.map((p) => ({ name: p.name, count: 0 }))
      }
      initialCourses={
        report && report.courses.length
          ? report.courses.map((c) => ({
              name: c.name,
              type: c.type,
              count: c.count,
            }))
          : coursePresets.map((p) => ({ name: p.name, type: p.type, count: 0 }))
      }
      initialNotes={report?.notes ?? ""}
      presetNationalities={natPresets.map((p) => p.name)}
      updatedAt={report?.updatedAt?.toISOString() ?? null}
    />
  );
}
