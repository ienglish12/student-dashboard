import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, type ReportWithRelations } from "@/lib/aggregate";
import { DashboardClient } from "./dashboard-client";
import { branchDisplayName, sortBranches, toBranchRef } from "@/lib/branches";

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
    prisma.branch.findMany(),
  ]);
  const orderedBranches = sortBranches(branches);
  const displayReports = reports.map((r) => ({
    ...r,
    branch: { ...r.branch, name: branchDisplayName(r.branch) },
  }));

  // When a branch is selected, scope the analysis to just that branch.
  const scopedReports =
    branchFilter === "all"
      ? displayReports
      : displayReports.filter((r) => r.branchId === branchFilter);
  const scopedBranches =
    branchFilter === "all"
      ? orderedBranches
      : orderedBranches.filter((b) => b.id === branchFilter);

  const data = aggregate(
    scopedReports as unknown as ReportWithRelations[],
    scopedBranches.map(toBranchRef),
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
      branches={orderedBranches.map(toBranchRef)}
      branchFilter={branchFilter}
      branchNotes={branchNotes}
    />
  );
}
