import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const [branches, reports] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
    prisma.monthlyReport.findMany({
      select: { branchId: true, period: true, male: true, female: true },
    }),
  ]);

  // period -> branchId -> total
  const map = new Map<string, Map<string, number>>();
  for (const r of reports) {
    const total = r.male + r.female;
    if (total <= 0) continue;
    if (!map.has(r.period)) map.set(r.period, new Map());
    map.get(r.period)!.set(r.branchId, total);
  }

  const periods = [...map.keys()].sort().reverse();
  const rows = periods.map((period) => ({
    period,
    totals: Object.fromEntries(map.get(period)!),
  }));

  return (
    <ReportsClient
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      rows={rows}
    />
  );
}
