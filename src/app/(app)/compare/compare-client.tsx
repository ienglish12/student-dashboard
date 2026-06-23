"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { aggregate, type ReportWithRelations } from "@/lib/aggregate";
import { useT, MONTHS } from "@/components/i18n";
import { MonthPicker } from "@/components/month-picker";
import { IconCompare } from "@/components/icons";

const BRAND = "#1d4ed8";
const NAVY = "#64748b";

export type CmpReport = ReportWithRelations & { period: string };

type Mode = "month" | "year" | "range";
type Spec = { mode: Mode; m: string; y: number; from: string; to: string };

function expand(spec: Spec): Set<string> {
  const out = new Set<string>();
  if (spec.mode === "month") out.add(spec.m);
  else if (spec.mode === "year") {
    for (let i = 1; i <= 12; i++) out.add(`${spec.y}-${String(i).padStart(2, "0")}`);
  } else {
    let [fy, fm] = spec.from.split("-").map(Number);
    const [ty, tm] = spec.to.split("-").map(Number);
    if (ty < fy || (ty === fy && tm < fm)) return out;
    while (fy < ty || (fy === ty && fm <= tm)) {
      out.add(`${fy}-${String(fm).padStart(2, "0")}`);
      fm++;
      if (fm > 12) {
        fm = 1;
        fy++;
      }
    }
  }
  return out;
}

export function CompareClient({
  branches,
  reports,
}: {
  branches: { id: string; name: string }[];
  reports: CmpReport[];
}) {
  const { t, lang } = useT();
  const now = new Date();
  const cur = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = prevDate.toISOString().slice(0, 7);
  const yr = now.getFullYear();

  const [branch, setBranch] = useState("all");
  const [a, setA] = useState<Spec>({ mode: "month", m: prev, y: yr - 1, from: prev, to: cur });
  const [b, setB] = useState<Spec>({ mode: "month", m: cur, y: yr, from: prev, to: cur });

  const agg = (spec: Spec) => {
    const periods = expand(spec);
    const rs = reports.filter(
      (r) => periods.has(r.period) && (branch === "all" || r.branchId === branch),
    );
    const bs =
      branch === "all" ? branches : branches.filter((x) => x.id === branch);
    return aggregate(rs as ReportWithRelations[], bs);
  };

  const A = useMemo(() => agg(a), [a, branch, reports]); // eslint-disable-line react-hooks/exhaustive-deps
  const B = useMemo(() => agg(b), [b, branch, reports]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelA = specLabel(a, lang);
  const labelB = specLabel(b, lang);

  const overviewData = [
    { name: t("kpi.total"), [labelA]: A.counts.total, [labelB]: B.counts.total },
    { name: t("legend.male"), [labelA]: A.counts.male, [labelB]: B.counts.male },
    { name: t("legend.female"), [labelA]: A.counts.female, [labelB]: B.counts.female },
  ];
  const ageData = A.ageGroups.map((g, i) => ({
    name: g.label,
    [labelA]: g.count,
    [labelB]: B.ageGroups[i]?.count ?? 0,
  }));

  const metrics: { label: string; a: number; b: number; suffix?: string; pp?: boolean }[] = [
    { label: t("kpi.total"), a: A.counts.total, b: B.counts.total },
    { label: t("legend.male"), a: A.counts.male, b: B.counts.male },
    { label: t("legend.female"), a: A.counts.female, b: B.counts.female },
    { label: t("kpi.avgAge"), a: A.counts.avgAge, b: B.counts.avgAge },
    { label: t("kpi.renewal"), a: A.counts.renewalRate, b: B.counts.renewalRate, suffix: "%", pp: true },
  ];

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1200px]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="size-10 rounded-xl bg-brand-50 grid place-items-center text-brand">
              <IconCompare />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-ink leading-tight">{t("cmp.title")}</h1>
              <p className="text-xs text-ink-soft">{t("cmp.subtitle")}</p>
            </div>
          </div>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="field w-auto"
          >
            <option value="all">{t("cmp.allBranches")}</option>
            {branches.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>

        {/* Period selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PeriodCard title={t("cmp.periodA")} spec={a} setSpec={setA} t={t} accent="brand" />
          <PeriodCard title={t("cmp.periodB")} spec={b} setSpec={setB} t={t} accent="navy" />
        </div>

        {/* Results */}
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-3 bg-canvas text-sm font-bold text-ink-soft">
            <div className="p-3">{t("cmp.metric")}</div>
            <div className="p-3 text-center text-brand">{specLabel(a, lang)}</div>
            <div className="p-3 text-center text-ink">{specLabel(b, lang)}</div>
          </div>
          {metrics.map((m) => {
            const diff = Math.round((m.b - m.a) * 10) / 10;
            const up = diff > 0;
            const flat = diff === 0;
            return (
              <div key={m.label} className="grid grid-cols-3 border-t border-line items-center">
                <div className="p-3 font-bold text-ink">{m.label}</div>
                <div className="p-3 text-center text-lg font-extrabold text-brand">
                  {m.a}
                  {m.suffix}
                </div>
                <div className="p-3 text-center">
                  <span className="text-lg font-extrabold text-ink">
                    {m.b}
                    {m.suffix}
                  </span>
                  {!flat && (
                    <span
                      className={`block text-xs font-bold ${up ? "text-success" : "text-danger"}`}
                    >
                      {up ? "▲" : "▼"} {Math.abs(diff)}
                      {m.pp ? " pp" : m.suffix ?? ""}
                    </span>
                  )}
                  {flat && <span className="block text-xs text-ink-soft">—</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-extrabold text-ink mb-4">{t("kpi.total")} / {t("legend.male")} / {t("legend.female")}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                  <Tooltip cursor={{ fill: "var(--brand-50)" }} />
                  <Legend />
                  <Bar dataKey={labelA} fill={BRAND} radius={[6, 6, 0, 0]} />
                  <Bar dataKey={labelB} fill={NAVY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-extrabold text-ink mb-4">{t("card.ageGroups")}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                  <Tooltip cursor={{ fill: "var(--brand-50)" }} />
                  <Legend />
                  <Bar dataKey={labelA} fill={BRAND} radius={[6, 6, 0, 0]} />
                  <Bar dataKey={labelB} fill={NAVY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodCard({
  title,
  spec,
  setSpec,
  t,
  accent,
}: {
  title: string;
  spec: Spec;
  setSpec: (s: Spec) => void;
  t: (k: string) => string;
  accent: "brand" | "navy";
}) {
  const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i);
  const modes: Mode[] = ["month", "year", "range"];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`font-extrabold ${accent === "brand" ? "text-brand" : "text-ink"}`}>
          {title}
        </span>
        <div className="flex gap-1 bg-canvas rounded-full p-1">
          {modes.map((mo) => (
            <button
              key={mo}
              onClick={() => setSpec({ ...spec, mode: mo })}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                spec.mode === mo ? "bg-brand text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t(`cmp.${mo}`)}
            </button>
          ))}
        </div>
      </div>

      {spec.mode === "month" && (
        <MonthPicker value={spec.m} onChange={(v) => setSpec({ ...spec, m: v })} />
      )}
      {spec.mode === "year" && (
        <select
          value={spec.y}
          onChange={(e) => setSpec({ ...spec, y: parseInt(e.target.value, 10) })}
          className="field w-auto"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}
      {spec.mode === "range" && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-soft">{t("cmp.from")}</span>
          <MonthPicker value={spec.from} onChange={(v) => setSpec({ ...spec, from: v })} />
          <span className="text-xs text-ink-soft">{t("cmp.to")}</span>
          <MonthPicker value={spec.to} onChange={(v) => setSpec({ ...spec, to: v })} />
        </div>
      )}
    </div>
  );
}

function specLabel(spec: Spec, lang: "ar" | "en") {
  const m = (p: string) => {
    const [y, mm] = p.split("-");
    return `${MONTHS[lang][parseInt(mm, 10) - 1] ?? mm} ${y}`;
  };
  if (spec.mode === "month") return m(spec.m);
  if (spec.mode === "year") return String(spec.y);
  return `${m(spec.from)} → ${m(spec.to)}`;
}
