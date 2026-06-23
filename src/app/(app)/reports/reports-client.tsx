"use client";

import Link from "next/link";
import { useT, MONTHS } from "@/components/i18n";
import { IconClipboard, IconCheck } from "@/components/icons";

type Row = { period: string; totals: Record<string, number> };

export function ReportsClient({
  branches,
  rows,
}: {
  branches: { id: string; name: string }[];
  rows: Row[];
}) {
  const { t, lang } = useT();

  const fmt = (period: string) => {
    const [y, m] = period.split("-");
    return `${MONTHS[lang][parseInt(m, 10) - 1] ?? m} ${y}`;
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px]">
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
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-start font-bold text-ink-soft p-3 sticky start-0 bg-card">
                    {t("rep.month")}
                  </th>
                  {branches.map((b) => (
                    <th key={b.id} className="font-bold text-ink-soft p-3 whitespace-nowrap text-center">
                      {b.name}
                    </th>
                  ))}
                  <th className="font-bold text-ink-soft p-3 text-center">{t("rep.total")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const submitted = branches.filter((b) => row.totals[b.id] > 0).length;
                  const grand = Object.values(row.totals).reduce((a, c) => a + c, 0);
                  return (
                    <tr key={row.period} className="border-b border-line/60 hover:bg-canvas">
                      <td className="p-3 font-bold text-ink whitespace-nowrap sticky start-0 bg-card">
                        {fmt(row.period)}
                        <span
                          className={`block text-[11px] font-normal ${
                            submitted === branches.length ? "text-success" : "text-warning"
                          }`}
                        >
                          {submitted}/{branches.length} {t("rep.submitted")}
                        </span>
                      </td>
                      {branches.map((b) => {
                        const v = row.totals[b.id];
                        return (
                          <td key={b.id} className="p-3 text-center">
                            {v > 0 ? (
                              <Link
                                href={`/dashboard?period=${row.period}&branch=${b.id}`}
                                className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success font-bold px-2.5 py-1 hover:bg-success/20"
                              >
                                <IconCheck width={13} height={13} /> {v}
                              </Link>
                            ) : (
                              <span className="text-danger/70 font-bold">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center font-extrabold text-ink">
                        <Link href={`/dashboard?period=${row.period}`} className="hover:text-brand">
                          {grand.toLocaleString("en")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-ink-soft no-print">
          <span className="inline-flex items-center gap-1 text-success font-bold">
            <IconCheck width={13} height={13} /> {t("rep.submitted")}
          </span>
          {"  ·  "}
          <span className="text-danger/70 font-bold">—</span> {t("rep.missing")}
        </p>
      </div>
    </div>
  );
}
