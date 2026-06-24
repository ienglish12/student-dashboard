import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";
import { branchDisplayName, sortBranches } from "@/lib/branches";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const [branches, users, resetRequests] = await Promise.all([
    prisma.branch.findMany({
      include: { _count: { select: { reports: true, users: true } } },
    }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { branch: { select: { name: true, slug: true } } },
    }),
    prisma.passwordResetRequest.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const me = users.find((u) => u.id === session.userId);

  return (
    <SettingsClient
      currentUserId={session.userId}
      currentEmail={me?.email ?? ""}
      branches={sortBranches(branches).map((b) => ({
        id: b.id,
        name: branchDisplayName(b),
        slug: b.slug,
        reports: b._count.reports,
        users: b._count.users,
      }))}
      users={users
        .filter((u) => u.role !== "ADMIN")
        .map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          branchName: u.branch ? branchDisplayName(u.branch) : null,
        }))}
      resetRequests={resetRequests.map((r) => ({
        id: r.id,
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
