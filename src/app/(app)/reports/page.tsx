import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClient, type MonthRow } from "./reports-client";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const [branches, reports, uploads] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
    prisma.monthlyReport.findMany({
      select: { branchId: true, period: true, male: true, female: true },
    }),
    prisma.upload.findMany({
      select: { id: true, branchId: true, period: true, filename: true, uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  // period -> branchId -> { total, uploadId, filename }
  const map = new Map<
    string,
    Map<string, { total: number; uploadId?: string; filename?: string }>
  >();
  const ensure = (p: string) => {
    if (!map.has(p)) map.set(p, new Map());
    return map.get(p)!;
  };
  for (const r of reports) {
    const total = r.male + r.female;
    if (total <= 0) continue;
    ensure(r.period).set(r.branchId, { total });
  }
  for (const u of uploads) {
    const cell = ensure(u.period).get(u.branchId);
    if (cell) {
      cell.uploadId = u.id;
      cell.filename = u.filename;
    } else {
      ensure(u.period).set(u.branchId, { total: 0, uploadId: u.id, filename: u.filename });
    }
  }

  const periods = [...map.keys()].sort().reverse();
  const rows: MonthRow[] = periods.map((period) => ({
    period,
    cells: Object.fromEntries(map.get(period)!),
  }));

  return (
    <ReportsClient
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      rows={rows}
    />
  );
}
