import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const [branches, users, resetRequests] = await Promise.all([
    prisma.branch.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { reports: true, users: true } } },
    }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { branch: { select: { name: true } } },
    }),
    prisma.passwordResetRequest.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <SettingsClient
      currentUserId={session.userId}
      branches={branches.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        reports: b._count.reports,
        users: b._count.users,
      }))}
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        branchName: u.branch?.name ?? null,
      }))}
      resetRequests={resetRequests.map((r) => ({
        id: r.id,
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
