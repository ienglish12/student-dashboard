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
import { aggregate, type Aggregated, type ReportWithRelations } from "@/lib/aggregate";
import { useT, MONTHS } from "@/components/i18n";
import { useTheme } from "@/components/theme";
import { MonthPicker } from "@/components/month-picker";
import { IconCompare, IconBulb, IconPrint } from "@/components/icons";

export type CmpReport = ReportWithRelations & { period: string };

type Mode = "month" | "year" | "range";
type Spec = { branch: string; mode: Mode; m: string; y: number; from: string; to: string };

const CLASS_LABEL: Record<string, string> = {
  classGroupAdult: "f.groupAdult",
  classVipAdult: "f.vipAdult",
  classVipKid: "f.vipKid",
  classOther: "f.classOther",
};

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

  const [notes, setNotes] = useState("");
  const [a, setA] = useState<Spec>({ branch: "all", mode: "month", m: prev, y: yr - 1, from: prev, to: cur });
  const [b, setB] = useState<Spec>({ branch: "all", mode: "month", m: cur, y: yr, from: prev, to: cur });

  const agg = (spec: Spec) => {
    const periods = expand(spec);
    const rs = reports.filter(
      (r) => periods.has(r.period) && (spec.branch === "all" || r.branchId === spec.branch),
    );
    const bs =
      spec.branch === "all" ? branches : branches.filter((x) => x.id === spec.branch);
    return aggregate(rs as ReportWithRelations[], bs);
  };

  const A = useMemo(() => agg(a), [a, reports]); // eslint-disable-line react-hooks/exhaustive-deps
  const B = useMemo(() => agg(b), [b, reports]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelA = sideLabel(a, branches, lang, t);
  const labelB = sideLabel(b, branches, lang, t);

  const overviewData = [
    { name: t("kpi.total"), A: A.counts.total, B: B.counts.total },
    { name: t("legend.male"), A: A.counts.male, B: B.counts.male },
    { name: t("legend.female"), A: A.counts.female, B: B.counts.female },
  ];
  const ageData = A.ageGroups.map((g, i) => ({
    name: g.label,
    A: g.count,
    B: B.ageGroups[i]?.count ?? 0,
  }));
  const levelData = mergeByKey(
    A.levels.map((l) => ({ key: l.key, name: l.label, count: l.count })),
    B.levels,
  );
  const deliveryData = mergeByKey(
    A.deliveryOverall.map((d) => ({ key: d.key, name: d.label, count: d.count })),
    B.deliveryOverall,
  );
  const classData = mergeByKey(
    A.classOverall.map((c) => ({ key: c.key, name: t(CLASS_LABEL[c.key] ?? c.key), count: c.count })),
    B.classOverall,
  );
  const natData = mergeByName(A.topNationalities, B.topNationalities).slice(0, 10);

  const metrics: { label: string; a: number; b: number; suffix?: string; pp?: boolean }[] = [
    { label: t("kpi.total"), a: A.counts.total, b: B.counts.total },
    { label: t("legend.male"), a: A.counts.male, b: B.counts.male },
    { label: t("legend.female"), a: A.counts.female, b: B.counts.female },
    { label: t("kpi.avgAge"), a: A.counts.avgAge, b: B.counts.avgAge },
    { label: t("kpi.renewal"), a: A.counts.renewalRate, b: B.counts.renewalRate, suffix: "%", pp: true },
  ];

  const conclusions = buildConclusions(A, B, labelA, labelB, lang);
  const noData = A.counts.total === 0 && B.counts.total === 0;

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
          <button
            onClick={() => window.print()}
            className="card flex items-center gap-2 px-3 py-2 text-sm font-bold text-ink-soft hover:text-brand no-print"
          >
            <IconPrint width={18} height={18} />
            {t("cmp.print")}
          </button>
        </div>

        {/* Side selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SideCard title={t("cmp.periodA")} spec={a} setSpec={setA} t={t} branches={branches} accent="brand" />
          <SideCard title={t("cmp.periodB")} spec={b} setSpec={setB} t={t} branches={branches} accent="navy" />
        </div>

        {noData && (
          <div className="card p-4 text-center text-ink-soft text-sm">{t("cmp.noData")}</div>
        )}

        {/* Results table */}
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-3 bg-canvas text-sm font-bold text-ink-soft">
            <div className="p-3">{t("cmp.metric")}</div>
            <div className="p-3 text-center text-brand">{labelA}</div>
            <div className="p-3 text-center text-ink">{labelB}</div>
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
          <CmpChart title={t("cmp.overview")} data={overviewData} labelA={labelA} labelB={labelB} />
          <CmpChart title={t("card.ageGroups")} data={ageData} labelA={labelA} labelB={labelB} />
          <CmpChart title={t("card.levels")} data={levelData} labelA={labelA} labelB={labelB} />
          <CmpChart title={t("sec.delivery")} data={deliveryData} labelA={labelA} labelB={labelB} />
          <CmpChart title={t("sec.classType")} data={classData} labelA={labelA} labelB={labelB} />
          <CmpChart title={t("card.topNats")} data={natData} labelA={labelA} labelB={labelB} />
        </div>

        {/* Notes & conclusions */}
        <div className="rounded-2xl bg-navy text-white p-6 space-y-5">
          <div className="flex items-center gap-2">
            <IconBulb className="text-warning" />
            <h3 className="font-extrabold">{t("cmp.conclusions")}</h3>
          </div>

          <div>
            <p className="text-xs text-white/50 mb-2">{t("cmp.autoNotes")}</p>
            <ul className="space-y-2">
              {conclusions.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-warning shrink-0">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="no-print">
            <p className="text-xs text-white/50 mb-2">{t("cmp.yourNotes")}</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("cmp.notesPlaceholder")}
              rows={4}
              className="w-full rounded-xl bg-white/10 border border-white/15 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-warning resize-y"
            />
          </div>
          {notes.trim() && (
            <div className="hidden print:block">
              <p className="text-xs text-white/50 mb-1">{t("cmp.yourNotes")}</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CmpChart({
  title,
  data,
  labelA,
  labelB,
}: {
  title: string;
  data: { name: string; A: number; B: number }[];
  labelA: string;
  labelB: string;
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  // Lighter, clearly distinct colors in dark mode
  const colorA = dark ? "#60a5fa" : "#1d4ed8";
  const colorB = dark ? "#fbbf24" : "#64748b";
  return (
    <div className="card p-5">
      <h3 className="font-extrabold text-ink mb-4">{title}</h3>
      <div className="h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--ink-soft)", fontWeight: 600 }} tickMargin={6} interval={0} />
            <YAxis tick={{ fontSize: 12, fill: "var(--ink-soft)", fontWeight: 600 }} tickMargin={6} width={48} />
            <Tooltip cursor={{ fill: "var(--brand-50)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }} />
            <Legend />
            <Bar dataKey="A" name={labelA} fill={colorA} radius={[6, 6, 0, 0]} />
            <Bar dataKey="B" name={labelB} fill={colorB} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SideCard({
  title,
  spec,
  setSpec,
  t,
  branches,
  accent,
}: {
  title: string;
  spec: Spec;
  setSpec: (s: Spec) => void;
  t: (k: string) => string;
  branches: { id: string; name: string }[];
  accent: "brand" | "navy";
}) {
  const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i);
  const modes: Mode[] = ["month", "year", "range"];
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
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

      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-soft shrink-0">{t("cmp.branch")}</span>
        <select
          value={spec.branch}
          onChange={(e) => setSpec({ ...spec, branch: e.target.value })}
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

function mergeByKey(
  aRows: { key: string; name: string; count: number }[],
  bRows: { key: string; count: number }[],
) {
  const bMap = new Map(bRows.map((r) => [r.key, r.count]));
  return aRows.map((r) => ({ name: r.name, A: r.count, B: bMap.get(r.key) ?? 0 }));
}

function mergeByName(
  aRows: { name: string; count: number }[],
  bRows: { name: string; count: number }[],
) {
  const aMap = new Map(aRows.map((r) => [r.name, r.count]));
  const bMap = new Map(bRows.map((r) => [r.name, r.count]));
  const names = new Set([...aMap.keys(), ...bMap.keys()]);
  return [...names]
    .map((name) => ({ name, A: aMap.get(name) ?? 0, B: bMap.get(name) ?? 0 }))
    .sort((x, y) => y.A + y.B - (x.A + x.B));
}

function sideLabel(
  spec: Spec,
  branches: { id: string; name: string }[],
  lang: "ar" | "en",
  t: (k: string) => string,
) {
  const branchName =
    spec.branch === "all" ? t("cmp.allBranches") : branches.find((x) => x.id === spec.branch)?.name ?? "";
  return `${branchName} · ${periodLabel(spec, lang)}`;
}

function periodLabel(spec: Spec, lang: "ar" | "en") {
  const m = (p: string) => {
    const [y, mm] = p.split("-");
    return `${MONTHS[lang][parseInt(mm, 10) - 1] ?? mm} ${y}`;
  };
  if (spec.mode === "month") return m(spec.m);
  if (spec.mode === "year") return String(spec.y);
  return `${m(spec.from)} → ${m(spec.to)}`;
}

function pctChange(a: number, b: number) {
  if (a === 0) return b === 0 ? 0 : 100;
  return Math.round(((b - a) / a) * 1000) / 10;
}

function buildConclusions(
  A: Aggregated,
  B: Aggregated,
  la: string,
  lb: string,
  lang: "ar" | "en",
): string[] {
  const ar = lang === "ar";
  if (A.counts.total === 0 && B.counts.total === 0) {
    return [ar ? "لا توجد بيانات للمقارنة في الجهتين المختارتين." : "No data to compare for the selected sides."];
  }

  const out: string[] = [];
  const dt = pctChange(A.counts.total, B.counts.total);
  const totalDiff = Math.abs(B.counts.total - A.counts.total);

  // Headline — total students
  if (dt > 0) {
    out.push(
      ar
        ? `«${lb}» أعلى في إجمالي الطلاب من «${la}» بفارق ${totalDiff} طالباً (+${dt}%): ${B.counts.total} مقابل ${A.counts.total}.`
        : `"${lb}" leads "${la}" in total students by ${totalDiff} (+${dt}%): ${B.counts.total} vs ${A.counts.total}.`,
    );
  } else if (dt < 0) {
    out.push(
      ar
        ? `«${lb}» أقل في إجمالي الطلاب من «${la}» بفارق ${totalDiff} طالباً (${dt}%): ${B.counts.total} مقابل ${A.counts.total}.`
        : `"${lb}" trails "${la}" in total students by ${totalDiff} (${dt}%): ${B.counts.total} vs ${A.counts.total}.`,
    );
  } else {
    out.push(
      ar
        ? `الإجمالي متساوٍ بين «${la}» و«${lb}» عند ${A.counts.total} طالباً.`
        : `Totals are equal between "${la}" and "${lb}" at ${A.counts.total} students.`,
    );
  }

  // Gender split
  out.push(
    ar
      ? `نسبة الذكور تغيّرت من ${A.counts.malePct}% إلى ${B.counts.malePct}%، والإناث من ${A.counts.femalePct}% إلى ${B.counts.femalePct}%.`
      : `Male share moved from ${A.counts.malePct}% to ${B.counts.malePct}%, female from ${A.counts.femalePct}% to ${B.counts.femalePct}%.`,
  );

  // Average age
  if (A.counts.avgAge !== B.counts.avgAge) {
    out.push(
      ar
        ? `متوسط العمر تغيّر من ${A.counts.avgAge} إلى ${B.counts.avgAge} سنة.`
        : `Average age changed from ${A.counts.avgAge} to ${B.counts.avgAge} years.`,
    );
  }

  // Renewal rate (percentage points)
  const dr = Math.round((B.counts.renewalRate - A.counts.renewalRate) * 10) / 10;
  if (dr !== 0) {
    out.push(
      ar
        ? `نسبة التجديد ${dr > 0 ? "ارتفعت" : "انخفضت"} بمقدار ${Math.abs(dr)} نقطة مئوية (${A.counts.renewalRate}% ← ${B.counts.renewalRate}%).`
        : `Renewal rate ${dr > 0 ? "rose" : "fell"} by ${Math.abs(dr)} pp (${A.counts.renewalRate}% → ${B.counts.renewalRate}%).`,
    );
  }

  // Dominant nationality on side B
  const topNatB = B.topNationalities[0];
  if (topNatB) {
    out.push(
      ar
        ? `أكثر جنسية في «${lb}» هي ${topNatB.name} بنسبة ${topNatB.pct}%.`
        : `The largest nationality in "${lb}" is ${topNatB.name} at ${topNatB.pct}%.`,
    );
  }

  return out;
}
