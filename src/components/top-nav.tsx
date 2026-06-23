"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme";
import { useT, LangToggle } from "@/components/i18n";
import {
  IconDashboard,
  IconSettings,
  IconLogout,
  IconClipboard,
  IconCompare,
} from "@/components/icons";
import type { Role } from "@/lib/enums";

export function TopNav({
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
          { href: "/dashboard", label: t("nav.analysis"), icon: <IconDashboard width={18} height={18} /> },
          { href: "/compare", label: t("nav.compare"), icon: <IconCompare width={18} height={18} /> },
          { href: "/reports", label: t("nav.reports"), icon: <IconClipboard width={18} height={18} /> },
          { href: "/settings", label: t("nav.settings"), icon: <IconSettings width={18} height={18} /> },
        ]
      : [];

  return (
    <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-line no-print">
      <div className="flex items-center gap-4 h-16 px-4 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="size-9 rounded-xl bg-navy grid place-items-center text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 15v-3M12 15V9M17 15v-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="font-extrabold text-ink leading-tight">{t("app.name")}</p>
            <p className="text-[10px] text-ink-soft -mt-0.5">{t("app.tagline")}</p>
          </div>
        </div>

        {/* Nav links (admin) */}
        <nav className="flex items-center gap-1 mr-2">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-brand-50 text-brand"
                    : "text-ink-soft hover:bg-canvas hover:text-ink"
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 rounded-full bg-canvas pr-3 pl-1 py-1">
            <span className="text-xs">
              <span className="text-ink-soft">
                {role === "ADMIN" ? t("role.admin") : t("role.branch")}
                {role === "BRANCH" && branchName ? ` · ${branchName}` : ""}
              </span>
            </span>
            <span className="size-7 rounded-full bg-brand grid place-items-center text-white text-sm font-bold">
              {initial}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="size-9 rounded-full grid place-items-center text-danger hover:bg-danger-50 transition"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <IconLogout width={18} height={18} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
