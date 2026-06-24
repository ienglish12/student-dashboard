"use client";

import { useT } from "@/components/i18n";

export type DetectedColumn = {
  key: string;
  labelKey: string;
  header: string | null;
  critical: boolean;
};

export function ImportSummary({ columns }: { columns: DetectedColumn[] }) {
  const { t } = useT();
  if (!columns || columns.length === 0) return null;

  const recognized = columns.filter((c) => c.header);
  const missing = columns.filter((c) => !c.header);
  const missingCritical = missing.filter((c) => c.critical);

  return (
    <div className="card p-4 space-y-3 text-sm">
      <p className="font-bold text-ink">{t("csv.colsTitle")}</p>

      <div>
        <p className="text-xs text-ink-soft mb-1.5">{t("csv.recognized")}</p>
        <div className="flex flex-wrap gap-1.5">
          {recognized.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-bold"
              title={c.header ?? ""}
            >
              ✓ {t(c.labelKey)}
            </span>
          ))}
          {recognized.length === 0 && <span className="text-ink-soft">—</span>}
        </div>
      </div>

      {missing.length > 0 && (
        <div>
          <p className="text-xs text-ink-soft mb-1.5">{t("csv.missing")}</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((c) => (
              <span
                key={c.key}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                  c.critical
                    ? "bg-danger-50 text-danger"
                    : "bg-warning/10 text-warning"
                }`}
              >
                ⚠ {t(c.labelKey)}
              </span>
            ))}
          </div>
          {missingCritical.length > 0 && (
            <p className="text-danger text-xs mt-2 font-bold">{t("csv.missingCritical")}</p>
          )}
        </div>
      )}
    </div>
  );
}
