"use client";

import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme";
import { useT, LangToggle } from "@/components/i18n";
import { BrandLogo } from "@/components/brand-logo";
import { IconLogout } from "@/components/icons";

export function StaffTopBar({
  branchName,
  email,
}: {
  branchName?: string | null;
  email?: string;
}) {
  const { t } = useT();
  const initial = (email?.[0] ?? "U").toUpperCase();

  return (
    <header className="no-print sticky top-0 z-30 bg-card border-b border-line">
      <div className="flex items-center gap-3 h-16 px-4 lg:px-8">
        <BrandLogo size="nav" />

        <div className="flex-1" />

        <LangToggle />
        <ThemeToggle />

        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-canvas px-2 py-1.5">
          <span className="size-8 rounded-full bg-brand grid place-items-center text-white text-sm font-bold shrink-0">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate leading-tight">{t("role.branch")}</p>
            <p className="text-[11px] text-ink-soft truncate leading-tight">
              {branchName ?? email}
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            title={t("logout")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-danger hover:bg-danger-50 transition"
          >
            <IconLogout width={18} height={18} />
            <span className="hidden sm:inline">{t("logout")}</span>
          </button>
        </form>
      </div>
    </header>
  );
}
