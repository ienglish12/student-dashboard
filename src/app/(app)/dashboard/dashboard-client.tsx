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
}: {
  period: string;
  data: Aggregated;
}) {
  const router = useRouter();
  const { counts, byBranch, topNationalities, ageGroups, levels, insights } =
    data;

  const empty = counts.total === 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-16 bg-card border-b border-line no-print">
        <span className="font-extrabold text-navy">iEnglish Analytics</span>
        <div className="flex items-center gap-2">
          <button onClick={() => router.refresh()} className="p-2 rounded-lg hover:bg-canvas text-ink-soft">
            <IconRefresh />
          </button>
          <button onClick={() => window.print()} className="p-2 rounded-lg hover:bg-canvas text-ink-soft">
            <IconPrint />
          </button>
        </div>
      </header>

      <div className="p-6 lg:p-8 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-navy">تحليل شامل</h1>
            <p className="text-sm text-ink-soft mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success inline-block" />
              {counts.submitted} من {counts.branches} فروع سلّمت الداتا
              {counts.missingCount > 0 && (
                <span className="text-warning">
                  {" "}
                  · ناقص {counts.missingCount}
                </span>
              )}
            </p>
          </div>
          <label className="card flex items-center gap-2 px-4 py-2 no-print">
            <IconCalendar className="text-brand" />
            <input
              type="month"
              value={period}
              onChange={(e) => router.push(`/dashboard?period=${e.target.value}`)}
              className="font-bold bg-transparent outline-none"
            />
          </label>
        </div>

        {empty ? (
          <EmptyState missing={counts.missing} />
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Kpi label="إجمالي الطلاب" value={counts.total.toLocaleString("en")} accent />
              <Kpi
                label="توزيع الجنس"
                value={`${counts.malePct}% / ${counts.femalePct}%`}
                sub="ذكور / إناث"
              />
              <Kpi label="متوسط الأعمار" value={String(counts.avgAge)} />
              <Kpi label="نسبة التجديد" value={`${counts.renewalRate}%`} />
              <Kpi label="الفرع الأكثر نمواً" value={insights.highest?.name ?? "—"} small />
            </div>

            {/* Demographics + branches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="الديموغرافية (الجنس)">
                <div className="relative h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "ذكور", value: counts.male },
                          { name: "إناث", value: counts.female },
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
                      <div className="text-2xl font-extrabold text-navy">
                        {counts.total.toLocaleString("en")}
                      </div>
                      <div className="text-xs text-ink-soft">إجمالي</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 text-sm mt-2">
                  <Legend color={NAVY} label="ذكور" pct={counts.malePct} />
                  <Legend color={PINK} label="إناث" pct={counts.femalePct} />
                </div>
              </Card>

              <Card title="توزيع الطلاب حسب الفرع" className="lg:col-span-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byBranch} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} reversed />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} orientation="right" />
                      <Tooltip cursor={{ fill: "#eff4ff" }} />
                      <Bar dataKey="total" name="المسجلين" fill={BRAND} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Nationalities + Age */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="أهم الجنسيات">
                <div className="space-y-3">
                  {topNationalities.map((n) => (
                    <ProgressRow key={n.name} label={n.name} pct={n.pct} />
                  ))}
                  {topNationalities.length === 0 && (
                    <p className="text-ink-soft text-sm">لا توجد بيانات.</p>
                  )}
                </div>
              </Card>

              <Card title="الفئات العمرية">
                <div className="space-y-3">
                  {ageGroups.map((a) => (
                    <ProgressRow key={a.key} label={a.label} pct={a.pct} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Levels */}
            <Card title="توزيع المستويات">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f8" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} reversed />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} orientation="right" />
                    <Tooltip cursor={{ fill: "#eff4ff" }} />
                    <Bar dataKey="count" name="الطلاب" fill={NAVY} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Auto insights */}
            <div className="rounded-2xl bg-navy text-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconBulb className="text-warning" />
                <h3 className="font-extrabold">رؤى ذكية (Auto Insights)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Insight
                  label="أعلى معدل تسجيل"
                  text={
                    insights.highest
                      ? `${insights.highest.name} يتصدر بـ ${insights.highest.total.toLocaleString("en")} طالب`
                      : "—"
                  }
                />
                <Insight
                  label="الفرع الأكثر تنوعاً"
                  text={
                    insights.mostDiverse
                      ? `${insights.mostDiverse.name} يضم ${insights.mostDiverse.uniqueNationalities} جنسية مختلفة`
                      : "—"
                  }
                />
                <Insight
                  label="أفضل استبقاء (Retention)"
                  text={
                    insights.bestRetention
                      ? `${insights.bestRetention.name} يحقق ${insights.bestRetention.renewalRate}% نسبة تجديد`
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
      <p className={`font-extrabold mt-1 ${small ? "text-lg" : "text-2xl"} ${accent ? "text-white" : "text-navy"}`}>
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
      <h3 className="font-extrabold text-navy mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Legend({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink-soft">{label}</span>
      <span className="font-bold text-ink">{pct}%</span>
    </span>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink">{label}</span>
        <span className="font-bold text-brand">{pct}%</span>
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

function EmptyState({ missing }: { missing: string[] }) {
  return (
    <div className="card p-12 text-center">
      <div className="size-14 rounded-full bg-canvas grid place-items-center mx-auto mb-4 text-ink-soft">
        <IconUsers width={28} height={28} />
      </div>
      <h3 className="font-extrabold text-navy text-lg">لا توجد بيانات لهذا الشهر</h3>
      <p className="text-ink-soft text-sm mt-2">
        لم يقم أي فرع بإدخال بياناته بعد لهذه الفترة.
      </p>
      {missing.length > 0 && (
        <p className="text-ink-soft text-xs mt-3">
          الفروع المتبقية: {missing.join("، ")}
        </p>
      )}
    </div>
  );
}
