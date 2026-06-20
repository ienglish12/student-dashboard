import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { reports: true, users: true } } },
  });

  return (
    <SettingsClient
      branches={branches.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        reports: b._count.reports,
        users: b._count.users,
      }))}
    />
  );
}
