import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, type ReportWithRelations } from "@/lib/aggregate";
import { DashboardClient } from "./dashboard-client";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; branch?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const sp = await searchParams;
  const period = sp.period || currentPeriod();
  const branchFilter = sp.branch || "all";

  const [reports, branches] = await Promise.all([
    prisma.monthlyReport.findMany({
      where: { period },
      include: { branch: true, nationalities: true, courses: true },
    }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);

  // When a branch is selected, scope the analysis to just that branch.
  const scopedReports =
    branchFilter === "all"
      ? reports
      : reports.filter((r) => r.branchId === branchFilter);
  const scopedBranches =
    branchFilter === "all"
      ? branches
      : branches.filter((b) => b.id === branchFilter);

  const data = aggregate(
    scopedReports as unknown as ReportWithRelations[],
    scopedBranches.map((b) => ({ id: b.id, name: b.name })),
  );

  // Notes for the selected branch (only meaningful in single-branch view).
  const branchNotes =
    branchFilter === "all"
      ? null
      : reports.find((r) => r.branchId === branchFilter)?.notes || null;

  return (
    <DashboardClient
      period={period}
      data={data}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      branchFilter={branchFilter}
      branchNotes={branchNotes}
    />
  );
}
