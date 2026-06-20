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
  email,
}: {
  role: Role;
  branchName?: string | null;
  email?: string;
}) {
  const pathname = usePathname();
  const initial = (email?.[0] ?? "U").toUpperCase();
  const roleLabel = role === "ADMIN" ? "مسؤول النظام" : "موظف فرع";

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
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-navy grid place-items-center text-white shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 15v-3M12 15V9M17 15v-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-navy leading-tight">آي إنجلش</h1>
            <p className="text-[11px] text-ink-soft">نظام تحليل البيانات</p>
          </div>
        </div>
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
        <div className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5">
          <div className="size-9 rounded-full bg-brand grid place-items-center text-white font-bold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate">{roleLabel}</p>
            <p className="text-[11px] text-ink-soft truncate">
              {role === "BRANCH" && branchName ? branchName : email}
            </p>
          </div>
        </div>
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
