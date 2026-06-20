"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  IconEntry,
  IconDashboard,
  IconSettings,
  IconLogout,
} from "@/components/icons";
import type { Role } from "@/lib/enums";

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function Sidebar({
  role,
  branchName,
}: {
  role: Role;
  branchName?: string | null;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/entry", label: "إدخال فرع", icon: <IconEntry /> },
  ];
  if (role === "ADMIN") {
    items.push(
      { href: "/dashboard", label: "الداشبورد", icon: <IconDashboard /> },
      { href: "/settings", label: "الإعدادات", icon: <IconSettings /> },
    );
  }

  return (
    <aside className="w-64 shrink-0 bg-card border-l border-line flex flex-col h-screen sticky top-0 no-print">
      <div className="p-6 border-b border-line">
        <h1 className="text-2xl font-extrabold text-navy">آي إنجلش</h1>
        <p className="text-xs text-ink-soft mt-0.5">نظام تحليل البيانات</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition ${
                active
                  ? "bg-brand-50 text-brand"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute right-0 inset-y-2 w-1 rounded-full bg-brand" />
              )}
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-line space-y-2">
        {role === "BRANCH" && branchName && (
          <div className="rounded-xl bg-canvas px-4 py-2.5 text-sm">
            <span className="text-ink-soft">الفرع: </span>
            <span className="font-bold text-ink">{branchName}</span>
          </div>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 font-bold text-danger hover:bg-danger-50 transition"
          >
            <IconLogout />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  );
}
