"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme";
import { useT, LangToggle } from "@/components/i18n";
import { BrandLogo } from "@/components/brand-logo";
import {
  IconDashboard,
  IconSettings,
  IconLogout,
  IconClipboard,
  IconCompare,
  IconUpload,
} from "@/components/icons";
import type { Role } from "@/lib/enums";

export function SideNav({
  role,
  branchName,
  email,
}: {
  role: Role;
  branchName?: string | null;
  email?: string;
}) {
  const pathname = usePathname();
  const { t } = useT();
  const initial = (email?.[0] ?? "U").toUpperCase();

  const items =
    role === "ADMIN"
      ? [
          { href: "/dashboard", label: t("nav.analysis"), icon: <IconDashboard width={20} height={20} /> },
          { href: "/compare", label: t("nav.compare"), icon: <IconCompare width={20} height={20} /> },
          { href: "/reports", label: t("nav.reports"), icon: <IconClipboard width={20} height={20} /> },
          { href: "/import", label: t("nav.import"), icon: <IconUpload width={20} height={20} /> },
          { href: "/settings", label: t("nav.settings"), icon: <IconSettings width={20} height={20} /> },
        ]
      : [];

  return (
    <aside className="no-print sticky top-0 h-screen shrink-0 w-16 lg:w-60 flex flex-col bg-card border-e border-line pt-3">
      {/* Brand */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-2 lg:px-5 border-b border-line shrink-0">
        <span className="hidden lg:block">
          <BrandLogo size="nav" />
        </span>
        <span className="lg:hidden text-brand font-extrabold text-lg">iE</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition justify-center lg:justify-start ${
                active
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              }`}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom bar: language/theme toggles + user info + logout */}
      <div className="border-t border-line p-2 lg:p-3 space-y-2 shrink-0">
        <div className="flex items-center justify-center lg:justify-start gap-1">
          <LangToggle />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-canvas p-2">
          <span className="size-8 rounded-full bg-brand grid place-items-center text-white text-sm font-bold shrink-0">
            {initial}
          </span>
          <div className="hidden lg:block min-w-0">
            <p className="text-xs font-bold text-ink truncate">
              {role === "ADMIN" ? t("role.admin") : t("role.branch")}
            </p>
            <p className="text-[11px] text-ink-soft truncate">
              {role === "BRANCH" && branchName ? branchName : email}
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            title={t("logout")}
            className="w-full flex items-center justify-center lg:justify-start gap-2 rounded-xl px-3 py-2 text-sm font-bold text-danger hover:bg-danger-50 transition"
          >
            <IconLogout width={18} height={18} />
            <span className="hidden lg:inline">{t("logout")}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
