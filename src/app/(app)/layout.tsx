import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SideNav } from "@/components/side-nav";
import { StaffTopBar } from "@/components/staff-top-bar";
import type { Role } from "@/lib/enums";
import { branchDisplayName } from "@/lib/branches";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const branchName = user.branch ? branchDisplayName(user.branch) : null;

  // Admins get the vertical sidebar; branch staff (simple, no nav links)
  // get a plain top bar instead.
  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col bg-canvas pt-3">
        <StaffTopBar branchName={branchName} email={user.email} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-canvas pt-3">
      <SideNav role={user.role as Role} branchName={branchName} email={user.email} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
