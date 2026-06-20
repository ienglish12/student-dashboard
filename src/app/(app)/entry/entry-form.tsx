"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NumberBox } from "@/components/number-box";
import {
  IconUsers,
  IconCalendar,
  IconGlobe,
  IconBook,
  IconPin,
  IconPlus,
  IconTrash,
  IconCheck,
  IconSave,
  IconRefresh,
} from "@/components/icons";
import {
  GENDER_FIELDS,
  AGE_FIELDS,
  CLASS_FIELDS,
  LEVEL_FIELDS,
  DELIVERY_FIELDS,
  type ReportNumbers,
  type NumericField,
} from "@/lib/fields";
import { COURSE_TYPES, COURSE_TYPE_LABELS, type CourseType } from "@/lib/enums";
import { saveReport } from "@/app/actions/reports";

type Nat = { name: string; count: number };
type Crs = { name: string; type: string; count: number };

export function EntryForm(props: {
  isAdmin: boolean;
  branchId: string;
  branchName: string;
  branches: { id: string; name: string }[];
  period: string;
  initialNumbers: ReportNumbers;
  initialNationalities: Nat[];
  initialCourses: Crs[];
  presetNationalities?: string[];
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [numbers, setNumbers] = useState<ReportNumbers>(props.initialNumbers);
  const [nationalities, setNationalities] = useState<Nat[]>(
    props.initialNationalities,
  );
  const [courses, setCourses] = useState<Crs[]>(props.initialCourses);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = (key: NumericField, v: number) =>
    setNumbers((n) => ({ ...n, [key]: Math.max(0, v) }));

  const grandTotal = numbers.male + numbers.female;

  const sumOf = (keys: NumericField[]) =>
    keys.reduce((a, k) => a + (numbers[k] || 0), 0);

  const natTotal = nationalities.reduce((a, n) => a + (n.count || 0), 0);
  const ageTotal = sumOf(AGE_FIELDS.map((f) => f.key));

  function save() {
    setSaved(false);
    startSaving(async () => {
      await saveReport({
        branchId: props.branchId,
        period: props.period,
        numbers,
        nationalities,
        courses,
      });
      setSaved(true);
      router.refresh();
    });
  }

  function navigate(next: { branch?: string; period?: string }) {
    const params = new URLSearchParams();
    params.set("branch", next.branch ?? props.branchId);
    params.set("period", next.period ?? props.period);
    router.push(`/entry?${params.toString()}`);
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 h-16 bg-card border-b border-line no-print">
        <span className="font-extrabold text-navy">iEnglish Analytics</span>
        <span className="text-sm text-ink-soft">إدخال البيانات الشهرية</span>
      </header>

      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-navy text-white p-5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">إجمالي الطلاب</p>
              <p className="text-4xl font-extrabold mt-1">{grandTotal}</p>
            </div>
            <div className="size-12 rounded-full bg-white/10 grid place-items-center">
              <IconUsers />
            </div>
          </div>

          <label className="card p-4">
            <span className="text-xs text-ink-soft">فترة التقرير</span>
            <div className="flex items-center gap-2 mt-1">
              <IconCalendar className="text-brand" />
              <input
                type="month"
                value={props.period}
                onChange={(e) => navigate({ period: e.target.value })}
                className="font-bold text-ink bg-transparent outline-none w-full"
              />
            </div>
          </label>

          <div className="card p-4">
            <span className="text-xs text-ink-soft">الفرع الحالي</span>
            {props.isAdmin ? (
              <select
                value={props.branchId}
                onChange={(e) => navigate({ branch: e.target.value })}
                className="font-bold text-ink bg-transparent outline-none w-full mt-1"
              >
                {props.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-ink">{props.branchName}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-ink-soft">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Gender */}
        <Section
          icon={<IconUsers className="text-brand" />}
          title="الجنس"
          hint={<MatchHint sum={grandTotal} total={grandTotal} alwaysMatch />}
        >
          <div className="grid grid-cols-2 gap-4">
            {GENDER_FIELDS.map((f) => (
              <LabeledBox
                key={f.key}
                label={f.label}
                value={numbers[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            ))}
          </div>
        </Section>

        {/* Age groups */}
        <Section
          icon={<IconUsers className="text-brand" />}
          title="الفئات العمرية"
          hint={<MatchHint sum={ageTotal} total={grandTotal} />}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {AGE_FIELDS.map((f) => (
              <NumberBox
                key={f.key}
                label={f.label}
                value={numbers[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            ))}
          </div>
        </Section>

        {/* Nationalities */}
        <Section
          icon={<IconGlobe className="text-brand" />}
          title="الجنسيات"
          hint={<MatchHint sum={natTotal} total={grandTotal} />}
          action={
            <button
              type="button"
              onClick={() =>
                setNationalities((l) => [...l, { name: "", count: 0 }])
              }
              className="text-brand font-bold text-sm flex items-center gap-1"
            >
              <IconPlus width={16} height={16} /> إضافة جنسية
            </button>
          }
        >
          {/* Quick-add chips from admin presets */}
          {props.presetNationalities && props.presetNationalities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {props.presetNationalities
                .filter(
                  (name) => !nationalities.some((n) => n.name === name),
                )
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setNationalities((l) => [...l, { name, count: 0 }])
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-50 px-3 py-1 text-sm font-bold text-brand hover:bg-brand hover:text-white transition"
                  >
                    <IconPlus width={14} height={14} /> {name}
                  </button>
                ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nationalities.length === 0 && (
              <p className="text-ink-soft text-sm">لا توجد جنسيات مضافة.</p>
            )}
            {nationalities.map((n, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl bg-canvas p-2"
              >
                <input
                  value={n.name}
                  placeholder="الجنسية"
                  onChange={(e) =>
                    setNationalities((l) =>
                      l.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  className="field flex-1 min-w-0"
                />
                <div className="w-24 shrink-0">
                  <NumberBox
                    value={n.count}
                    onChange={(v) =>
                      setNationalities((l) =>
                        l.map((x, j) => (j === i ? { ...x, count: v } : x)),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNationalities((l) => l.filter((_, j) => j !== i))
                  }
                  className="text-danger p-1.5 hover:bg-danger-50 rounded-lg"
                  aria-label="حذف"
                >
                  <IconTrash width={18} height={18} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Class types + Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section icon={<IconPin className="text-brand" />} title="نوع الفصل">
            <div className="space-y-3">
              {CLASS_FIELDS.map((f) => (
                <RowBox
                  key={f.key}
                  label={f.label}
                  value={numbers[f.key]}
                  onChange={(v) => set(f.key, v)}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={<IconBook className="text-brand" />}
            title="الدورات التدريبية"
            action={
              <button
                type="button"
                onClick={() =>
                  setCourses((l) => [
                    ...l,
                    { name: "", type: "GENERAL_ENGLISH", count: 0 },
                  ])
                }
                className="text-brand font-bold text-sm flex items-center gap-1"
              >
                <IconPlus width={16} height={16} /> إضافة دورة
              </button>
            }
          >
            <div className="space-y-3">
              {courses.length === 0 && (
                <p className="text-ink-soft text-sm">لا توجد دورات مضافة.</p>
              )}
              {courses.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={c.name}
                    placeholder="اسم الدورة"
                    onChange={(e) =>
                      setCourses((l) =>
                        l.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    className="field flex-1 min-w-0"
                  />
                  <select
                    value={c.type}
                    onChange={(e) =>
                      setCourses((l) =>
                        l.map((x, j) =>
                          j === i ? { ...x, type: e.target.value } : x,
                        ),
                      )
                    }
                    className="field w-32 shrink-0"
                  >
                    {COURSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {COURSE_TYPE_LABELS[t as CourseType]}
                      </option>
                    ))}
                  </select>
                  <div className="w-20 shrink-0">
                    <NumberBox
                      value={c.count}
                      onChange={(v) =>
                        setCourses((l) =>
                          l.map((x, j) => (j === i ? { ...x, count: v } : x)),
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCourses((l) => l.filter((_, j) => j !== i))
                    }
                    className="text-danger p-1.5 hover:bg-danger-50 rounded-lg"
                    aria-label="حذف"
                  >
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Levels */}
        <Section
          icon={<IconBook className="text-brand" />}
          title="المستويات الدراسية"
          hint={<MatchHint sum={sumOf(LEVEL_FIELDS.map((f) => f.key))} total={grandTotal} />}
        >
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
            {LEVEL_FIELDS.map((f) => (
              <NumberBox
                key={f.key}
                label={f.label}
                value={numbers[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            ))}
          </div>
        </Section>

        {/* Renewals + Delivery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section icon={<IconRefresh className="text-brand" />} title="التجديدات (Renewals)">
            <p className="text-sm text-ink-soft mb-3">عدد الطلاب الذين قاموا بالتجديد</p>
            <div className="w-40">
              <NumberBox
                value={numbers.renewals}
                onChange={(v) => set("renewals", v)}
              />
            </div>
            {grandTotal > 0 && (
              <p className="text-sm text-ink-soft mt-3">
                نسبة التجديد:{" "}
                <span className="font-bold text-brand">
                  {Math.round((numbers.renewals / grandTotal) * 100)}%
                </span>
              </p>
            )}
          </Section>

          <Section
            icon={<IconPin className="text-brand" />}
            title="طريقة الحضور"
            hint={<MatchHint sum={sumOf(DELIVERY_FIELDS.map((f) => f.key))} total={grandTotal} />}
          >
            <div className="grid grid-cols-3 gap-3">
              {DELIVERY_FIELDS.map((f) => (
                <NumberBox
                  key={f.key}
                  label={f.label}
                  value={numbers[f.key]}
                  onChange={(v) => set(f.key, v)}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 no-print">
          <p className="text-sm text-ink-soft">
            {props.updatedAt
              ? `آخر تحديث: ${new Date(props.updatedAt).toLocaleString("ar-EG")}`
              : "لم يتم الحفظ بعد"}
            {saved && (
              <span className="text-success font-bold mr-2">
                ✓ تم الحفظ
              </span>
            )}
          </p>
          <button onClick={save} disabled={saving} className="btn-dark">
            <IconSave />
            {saving ? "جارٍ الحفظ…" : "حفظ البيانات"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  hint,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-extrabold text-navy">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {hint}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

function MatchHint({
  sum,
  total,
  alwaysMatch,
}: {
  sum: number;
  total: number;
  alwaysMatch?: boolean;
}) {
  const match = alwaysMatch || sum === total;
  if (match) {
    return (
      <span className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2.5 py-1 rounded-full">
        <IconCheck width={14} height={14} /> مطابق للإجمالي
      </span>
    );
  }
  return (
    <span className="text-warning text-xs font-bold bg-warning/10 px-2.5 py-1 rounded-full">
      المجموع {sum} / الإجمالي {total}
    </span>
  );
}

function LabeledBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-sm text-ink-soft mb-1">{label}</div>
      <NumberBox value={value} onChange={onChange} />
    </div>
  );
}

function RowBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <div className="w-24 shrink-0">
        <NumberBox value={value} onChange={onChange} />
      </div>
    </div>
  );
}
