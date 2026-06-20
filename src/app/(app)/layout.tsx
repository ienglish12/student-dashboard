import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import type { Role } from "@/lib/enums";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-row-reverse">
      <Sidebar role={user.role as Role} branchName={user.branch?.name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
