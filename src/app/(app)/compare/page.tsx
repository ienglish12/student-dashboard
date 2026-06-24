import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NUMERIC_FIELDS } from "@/lib/fields";
import { CompareClient, type CmpReport } from "./compare-client";
import { branchDisplayName, sortBranches, toBranchRef } from "@/lib/branches";

export default async function ComparePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const [branches, reports] = await Promise.all([
    prisma.branch.findMany(),
    prisma.monthlyReport.findMany({
      include: { branch: true, nationalities: true, courses: true },
    }),
  ]);

  const payload: CmpReport[] = reports.map((r) => {
    const nums: Record<string, number> = {};
    for (const k of NUMERIC_FIELDS) nums[k] = r[k] as number;
    return {
      branchId: r.branchId,
      branch: { id: r.branch.id, name: branchDisplayName(r.branch) },
      period: r.period,
      ...nums,
      nationalities: r.nationalities.map((n) => ({ name: n.name, count: n.count })),
      courses: r.courses.map((c) => ({ name: c.name, type: c.type, count: c.count })),
    } as CmpReport;
  });

  return (
    <CompareClient
      branches={sortBranches(branches).map(toBranchRef)}
      reports={payload}
    />
  );
}
