import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const [branches, natPresets, coursePresets, users] = await Promise.all([
    prisma.branch.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { reports: true, users: true } } },
    }),
    prisma.nationalityPreset.findMany({ orderBy: { order: "asc" } }),
    prisma.coursePreset.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { branch: { select: { name: true } } },
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
      natPresets={natPresets.map((p) => ({ id: p.id, name: p.name }))}
      coursePresets={coursePresets.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
      }))}
    />
  );
}
