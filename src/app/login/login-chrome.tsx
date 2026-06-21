"use client";

import { useT, LangToggle } from "@/components/i18n";
import { ThemeToggle } from "@/components/theme";

export function LoginToggles() {
  return (
    <div className="fixed top-4 left-4 flex items-center gap-1 z-10">
      <LangToggle />
      <ThemeToggle />
    </div>
  );
}

export function LoginTagline() {
  const { t } = useT();
  return <p className="text-ink-soft text-sm">{t("login.tagline")}</p>;
}

export function LoginQuote() {
  const { t } = useT();
  return (
    <p className="mt-8 text-sm text-ink-soft italic text-center max-w-md">
      &quot;{t("login.quote")}&quot;
    </p>
  );
}
