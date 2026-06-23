"use client";

import Link from "next/link";
import { useT, MONTHS } from "@/components/i18n";
import { IconClipboard, IconCheck, IconDownload } from "@/components/icons";

type Cell = { total: number; uploadId?: string; filename?: string };
export type MonthRow = { period: string; cells: Record<string, Cell> };

export function ReportsClient({
  branches,
  rows,
}: {
  branches: { id: string; name: string }[];
  rows: MonthRow[];
}) {
  const { t, lang } = useT();
  const fmt = (period: string) => {
    const [y, m] = period.split("-");
    return `${MONTHS[lang][parseInt(m, 10) - 1] ?? m} ${y}`;
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1200px]">
        <div className="flex items-center gap-2.5">
          <span className="size-10 rounded-xl bg-brand-50 grid place-items-center text-brand">
            <IconClipboard />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink leading-tight">{t("rep.title")}</h1>
            <p className="text-xs text-ink-soft">{t("rep.subtitle")}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card p-12 text-center text-ink-soft">{t("rep.noData")}</div>
        ) : (
          rows.map((row) => {
            const submitted = branches.filter((b) => row.cells[b.id]?.total > 0).length;
            const grand = branches.reduce((a, b) => a + (row.cells[b.id]?.total ?? 0), 0);
            const complete = submitted === branches.length;
            return (
              <section key={row.period} className="card p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-extrabold text-ink">{fmt(row.period)}</h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        complete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}
                    >
                      {submitted}/{branches.length} {t("rep.submitted")}
                    </span>
                  </div>
                  <span className="text-sm text-ink-soft">
                    {t("rep.total")}:{" "}
                    <span className="font-extrabold text-ink">{grand.toLocaleString("en")}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {branches.map((b) => {
                    const c = row.cells[b.id];
                    const ok = c && c.total > 0;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                          ok ? "border-line" : "border-danger/30 bg-danger-50/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{b.name}</p>
                          {ok ? (
                            <p className="text-xs text-success flex items-center gap-1">
                              <IconCheck width={12} height={12} /> {c!.total} {t("rep.student")}
                            </p>
                          ) : (
                            <p className="text-xs text-danger font-bold">{t("rep.missing")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {ok && (
                            <Link
                              href={`/dashboard?period=${row.period}&branch=${b.id}`}
                              className="text-xs font-bold text-brand hover:underline px-1"
                            >
                              {t("rep.view")}
                            </Link>
                          )}
                          {c?.uploadId && (
                            <a
                              href={`/api/upload/${c.uploadId}`}
                              className="size-8 grid place-items-center rounded-lg text-ink-soft hover:bg-canvas hover:text-brand"
                              title={c.filename}
                            >
                              <IconDownload width={16} height={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
