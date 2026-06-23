import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  return <ImportClient branches={branches.map((b) => ({ id: b.id, name: b.name }))} />;
}
