"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { aggregate, type ReportWithRelations } from "@/lib/aggregate";
import { useT, MONTHS } from "@/components/i18n";
import { useTheme } from "@/components/theme";
import { IconTrend } from "@/components/icons";

export type TrendReport = ReportWithRelations & { period: string };

type Point = {
  period: string;
  label: string;
  total: number;
  male: number;
  female: number;
  renewalRate: number;
  avgAge: number;
};

function periodLabel(period: string, lang: "ar" | "en") {
  const [y, m] = period.split("-");
  return `${MONTHS[lang][parseInt(m, 10) - 1] ?? m} ${y.slice(2)}`;
}

export function TrendsClient({
  branches,
  reports,
}: {
  branches: { id: string; name: string }[];
  reports: TrendReport[];
}) {
  const { t, lang } = useT();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const BRAND = dark ? "#60a5fa" : "#1d4ed8";
  const PINK = dark ? "#f472b6" : "#ec4899";
  const AMBER = dark ? "#fbbf24" : "#d97706";

  const [branch, setBranch] = useState("all");

  const data: Point[] = useMemo(() => {
    const periods = [...new Set(reports.map((r) => r.period))].sort();
    const bs = branch === "all" ? branches : branches.filter((x) => x.id === branch);
    return periods.map((period) => {
      const rs = reports.filter(
        (r) => r.period === period && (branch === "all" || r.branchId === branch),
      );
      const a = aggregate(rs as ReportWithRelations[], bs);
      return {
        period,
        label: periodLabel(period, lang),
        total: a.counts.total,
        male: a.counts.male,
        female: a.counts.female,
        renewalRate: a.counts.renewalRate,
        avgAge: a.counts.avgAge,
      };
    });
  }, [branch, reports, branches, lang]);

  const empty = data.length === 0 || data.every((d) => d.total === 0);

  const axisTick = { fontSize: 12, fill: "var(--ink-soft)", fontWeight: 600 };
  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    color: "var(--ink)",
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1200px]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="size-10 rounded-xl bg-brand-50 grid place-items-center text-brand">
              <IconTrend />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-ink leading-tight">{t("trend.title")}</h1>
              <p className="text-xs text-ink-soft">{t("trend.subtitle")}</p>
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

        {empty ? (
          <div className="card p-12 text-center text-ink-soft">{t("trend.noData")}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TrendCard title={t("kpi.total")}>
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="label" tick={axisTick} tickMargin={6} />
                <YAxis tick={axisTick} tickMargin={6} width={44} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="total" name={t("kpi.total")} stroke={BRAND} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </TrendCard>

            <TrendCard title={`${t("legend.male")} / ${t("legend.female")}`}>
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="label" tick={axisTick} tickMargin={6} />
                <YAxis tick={axisTick} tickMargin={6} width={44} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="male" name={t("legend.male")} stroke={BRAND} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="female" name={t("legend.female")} stroke={PINK} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </TrendCard>

            <TrendCard title={t("kpi.renewal")}>
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="label" tick={axisTick} tickMargin={6} />
                <YAxis tick={axisTick} tickMargin={6} width={44} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="renewalRate" name={t("kpi.renewal")} stroke={AMBER} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </TrendCard>

            <TrendCard title={t("kpi.avgAge")}>
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="label" tick={axisTick} tickMargin={6} />
                <YAxis tick={axisTick} tickMargin={6} width={44} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="avgAge" name={t("kpi.avgAge")} stroke={BRAND} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </TrendCard>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="card p-5">
      <h3 className="font-extrabold text-ink mb-4">{title}</h3>
      <div className="h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
