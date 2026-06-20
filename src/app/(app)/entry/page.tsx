import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntryForm } from "./entry-form";
import { emptyNumbers, NUMERIC_FIELDS, type ReportNumbers } from "@/lib/fields";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const sp = await searchParams;
  const period = sp.period || currentPeriod();

  // Admin can pick any branch; branch user is locked to their own.
  const branches = isAdmin
    ? await prisma.branch.findMany({ orderBy: { name: "asc" } })
    : [];

  const branchId = isAdmin
    ? sp.branch || branches[0]?.id
    : user.branchId ?? undefined;

  if (!branchId) {
    return (
      <div className="p-10 text-center text-ink-soft">
        لا يوجد فرع مرتبط بهذا الحساب.
      </div>
    );
  }

  const branch = isAdmin
    ? branches.find((b) => b.id === branchId)
    : user.branch;

  const report = await prisma.monthlyReport.findUnique({
    where: { branchId_period: { branchId, period } },
    include: { nationalities: true, courses: true },
  });

  const numbers: ReportNumbers = emptyNumbers();
  if (report) {
    for (const k of NUMERIC_FIELDS) numbers[k] = report[k] as number;
  }

  return (
    <EntryForm
      isAdmin={isAdmin}
      branchId={branchId}
      branchName={branch?.name ?? ""}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      period={period}
      initialNumbers={numbers}
      initialNationalities={
        report?.nationalities.map((n) => ({ name: n.name, count: n.count })) ??
        []
      }
      initialCourses={
        report?.courses.map((c) => ({
          name: c.name,
          type: c.type,
          count: c.count,
        })) ?? []
      }
      updatedAt={report?.updatedAt?.toISOString() ?? null}
    />
  );
}
