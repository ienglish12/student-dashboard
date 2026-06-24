import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportClient } from "./import-client";
import { sortBranches, toBranchRef } from "@/lib/branches";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/entry");

  const branches = sortBranches(await prisma.branch.findMany());
  return <ImportClient branches={branches.map(toBranchRef)} />;
}
