"use client";

import { ThemeProvider } from "@/components/theme";
import { LangProvider } from "@/components/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>{children}</LangProvider>
    </ThemeProvider>
  );
}
