import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SideNav } from "@/components/side-nav";
import type { Role } from "@/lib/enums";
import { branchDisplayName } from "@/lib/branches";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex">
      <SideNav
        role={user.role as Role}
        branchName={user.branch ? branchDisplayName(user.branch) : null}
        email={user.email}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
