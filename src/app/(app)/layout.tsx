import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import type { Role } from "@/lib/enums";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav
        role={user.role as Role}
        branchName={user.branch?.name}
        email={user.email}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
