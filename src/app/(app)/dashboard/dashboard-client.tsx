"use client";

import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Aggregated } from "@/lib/aggregate";
import { useT } from "@/components/i18n";
import { MonthPicker } from "@/components/month-picker";
import {
  IconRefresh,
  IconPrint,
  IconCalendar,
  IconBulb,
  IconUsers,
} from "@/components/icons";

const NAVY = "#16243f";
const BRAND = "#1d4ed8";
const PINK = "#ec4899";

export function DashboardClient({
  period,
  data,
  branches,
  branchFilter,
  branchNotes,
}: {
  period: string;
  data: Aggregated;
  branches: { id: string; name: string }[];
  branchFilter: string;
  branchNotes: string | null;
}) {
  const router = useRouter();
  const { t } = useT();
  const { counts, byBranch, topNationalities, ageGroups, levels, insights } =
    data;

  const empty = counts.total === 0;
  const isSingle = branchFilter !== "all";
  const selectedName =
    branches.find((b) => b.id === branchFilter)?.name ?? "";

  const go = (next: { period?: string; branch?: string }) => {
    const params = new URLSearchParams();
    params.set("period", next.period ?? period);
    params.set("branch", next.branch ?? branchFilter);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px]">
        {/* Title + filters row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink">
              {isSingle ? selectedName : t("dash.titleAll")}
            </h1>
            <p className="text-sm text-ink-soft mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success inline-block" />
              {isSingle
                ? t("dash.single")
                : `${counts.submitted} ${t("dash.of")} ${counts.branches} ${t("dash.submitted")}`}
              {!isSingle && counts.missingCount > 0 && (
                <span className="text-warning"> · {t("dash.missing")} {counts.missingCount}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print flex-wrap">
            {/* Month filter */}
            <div className="card flex items-center gap-2 px-3 py-2">
              <IconCalendar className="text-brand" />
              <MonthPicker value={period} onChange={(p) => go({ period: p })} />
            </div>
            <button onClick={() => router.refresh()} className="card size-10 grid place-items-center text-ink-soft hover:text-brand" aria-label={t("refresh")}>
              <IconRefresh width={18} height={18} />
            </button>
            <button onClick={() => window.print()} className="card size-10 grid place-items-center text-ink-soft hover:text-brand" aria-label={t("print")}>
              <IconPrint width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Horizontal branch filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-print -mx-1 px-1">
          <FilterPill active={branchFilter === "all"} onClick={() => go({ branch: "all" })}>
            {t("dash.allBranches")}
          </FilterPill>
          {branches.map((b) => (
            <FilterPill
              key={b.id}
              active={branchFilter === b.id}
              onClick={() => go({ branch: b.id })}
            >
              {b.name}
            </FilterPill>
          ))}
        </div>

        {/* Branch notes (single-branch view) */}
        {isSingle && branchNotes && (
          <div className="card p-4 border-r-4 border-r-brand">
            <p className="text-xs font-bold text-ink-soft mb-1">{t("dash.branchNotes")}</p>
            <p className="text-ink">{branchNotes}</p>
          </div>
        )}

        {empty ? (
          <EmptyState missing={counts.missing} single={isSingle} t={t} />
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Kpi label={t("kpi.total")} value={counts.total.toLocaleString("en")} accent />
              <Kpi
                label={t("kpi.gender")}
                value={`${counts.malePct}% / ${counts.femalePct}%`}
                sub={t("kpi.maleFemale")}
              />
              <Kpi label={t("kpi.avgAge")} value={String(counts.avgAge)} />
              <Kpi label={t("kpi.renewal")} value={`${counts.renewalRate}%`} />
              <Kpi label={t("kpi.topBranch")} value={insights.highest?.name ?? "—"} small />
            </div>

            {/* Demographics + branches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title={t("card.demographics")}>
                <div className="relative h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: t("legend.male"), value: counts.male },
                          { name: t("legend.female"), value: counts.female },
                        ]}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill={NAVY} />
                        <Cell fill={PINK} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-ink">
                        {counts.total.toLocaleString("en")}
                      </div>
                      <div className="text-xs text-ink-soft">{t("kpi.total")}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 text-sm mt-2">
                  <Legend color={NAVY} label={t("legend.male")} pct={counts.malePct} count={counts.male} />
                  <Legend color={PINK} label={t("legend.female")} pct={counts.femalePct} count={counts.female} />
                </div>
              </Card>

              <Card title={t("card.byBranch")} className="lg:col-span-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byBranch} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} reversed />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} orientation="right" />
                      <Tooltip cursor={{ fill: "#eff4ff" }} />
                      <Bar dataKey="total" name={t("kpi.total")} fill={BRAND} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Nationalities + Age */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title={t("card.topNats")}>
                <div className="space-y-3">
                  {topNationalities.map((n) => (
                    <ProgressRow key={n.name} label={n.name} pct={n.pct} count={n.count} />
                  ))}
                  {topNationalities.length === 0 && (
                    <p className="text-ink-soft text-sm">—</p>
                  )}
                </div>
              </Card>

              <Card title={t("card.ageGroups")}>
                <div className="space-y-3">
                  {ageGroups.map((a) => (
                    <ProgressRow key={a.key} label={a.label} pct={a.pct} count={a.count} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Levels */}
            <Card title={t("card.levels")}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f8" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} reversed />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} orientation="right" />
                    <Tooltip cursor={{ fill: "#eff4ff" }} />
                    <Bar dataKey="count" name={t("kpi.total")} fill={NAVY} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Auto insights */}
            <div className="rounded-2xl bg-navy text-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconBulb className="text-warning" />
                <h3 className="font-extrabold">{t("ins.title")}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Insight
                  label={t("ins.highest")}
                  text={
                    insights.highest
                      ? `${insights.highest.name} ${t("ins.leadsWith")} ${insights.highest.total.toLocaleString("en")} ${t("ins.student")}`
                      : "—"
                  }
                />
                <Insight
                  label={t("ins.diverse")}
                  text={
                    insights.mostDiverse
                      ? `${insights.mostDiverse.name} ${t("ins.has")} ${insights.mostDiverse.uniqueNationalities} ${t("ins.nationalities")}`
                      : "—"
                  }
                />
                <Insight
                  label={t("ins.retention")}
                  text={
                    insights.bestRetention
                      ? `${insights.bestRetention.name} ${t("ins.achieves")} ${insights.bestRetention.renewalRate}% ${t("ins.renewalRate")}`
                      : "—"
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold border transition ${
        active
          ? "bg-brand text-white border-brand"
          : "bg-card text-ink-soft border-line hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? "bg-navy text-white" : "card"}`}>
      <p className={`text-xs ${accent ? "text-white/70" : "text-ink-soft"}`}>
        {label}
      </p>
      <p className={`font-extrabold mt-1 ${small ? "text-lg" : "text-2xl"} ${accent ? "text-white" : "text-ink"}`}>
        {value}
      </p>
      {sub && <p className={`text-[11px] ${accent ? "text-white/60" : "text-ink-soft"}`}>{sub}</p>}
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <h3 className="font-extrabold text-ink mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Legend({
  color,
  label,
  pct,
  count,
}: {
  color: string;
  label: string;
  pct: number;
  count?: number;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink-soft">{label}</span>
      <span className="font-bold text-ink">{pct}%</span>
      {count !== undefined && <span className="text-ink-soft">({count})</span>}
    </span>
  );
}

function ProgressRow({
  label,
  pct,
  count,
}: {
  label: string;
  pct: number;
  count?: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink">{label}</span>
        <span className="flex items-center gap-1.5">
          {count !== undefined && (
            <span className="text-ink-soft">({count})</span>
          )}
          <span className="font-bold text-brand">{pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-canvas overflow-hidden">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Insight({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className="font-bold leading-relaxed">{text}</p>
    </div>
  );
}

function EmptyState({
  missing,
  single,
  t,
}: {
  missing: string[];
  single?: boolean;
  t: (k: string) => string;
}) {
  return (
    <div className="card p-12 text-center">
      <div className="size-14 rounded-full bg-canvas grid place-items-center mx-auto mb-4 text-ink-soft">
        <IconUsers width={28} height={28} />
      </div>
      <h3 className="font-extrabold text-ink text-lg">{t("empty.title")}</h3>
      <p className="text-ink-soft text-sm mt-2">
        {single ? t("empty.single") : t("empty.all")}
      </p>
      {!single && missing.length > 0 && (
        <p className="text-ink-soft text-xs mt-3">
          {t("empty.remaining")}: {missing.join("، ")}
        </p>
      )}
    </div>
  );
}
