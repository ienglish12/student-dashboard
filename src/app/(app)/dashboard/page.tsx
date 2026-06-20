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
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const sp = await searchParams;
  const period = sp.period || currentPeriod();

  const [reports, branches] = await Promise.all([
    prisma.monthlyReport.findMany({
      where: { period },
      include: { branch: true, nationalities: true, courses: true },
    }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);

  const data = aggregate(
    reports as unknown as ReportWithRelations[],
    branches.map((b) => ({ id: b.id, name: b.name })),
  );

  return <DashboardClient period={period} data={data} />;
}
