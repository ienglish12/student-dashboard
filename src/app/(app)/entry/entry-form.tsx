"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NumberBox } from "@/components/number-box";
import { MonthPicker } from "@/components/month-picker";
import { useT } from "@/components/i18n";
import {
  IconUsers,
  IconGlobe,
  IconBook,
  IconPin,
  IconPlus,
  IconTrash,
  IconCheck,
  IconSave,
  IconWarning,
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
import { COURSE_TYPES } from "@/lib/enums";
import { saveReport } from "@/app/actions/reports";

type Nat = { name: string; count: number };
type Crs = { name: string; type: string; count: number };

// Map a field key to a translation key (falls back to the field's own label).
const FKEY: Record<string, string> = {
  male: "f.male",
  female: "f.female",
  classGroupAdult: "f.groupAdult",
  classVipAdult: "f.vipAdult",
  classVipKid: "f.vipKid",
  classOther: "f.classOther",
  onsite: "f.onsite",
  online: "f.online",
  home: "f.home",
};

export function EntryForm(props: {
  branchId: string;
  branchName: string;
  period: string;
  initialNumbers: ReportNumbers;
  initialNationalities: Nat[];
  initialCourses: Crs[];
  initialNotes: string;
  presetNationalities?: string[];
  updatedAt: string | null;
}) {
  const router = useRouter();
  const { t } = useT();
  const [numbers, setNumbers] = useState<ReportNumbers>(props.initialNumbers);
  const [nationalities, setNationalities] = useState<Nat[]>(
    props.initialNationalities,
  );
  const [courses, setCourses] = useState<Crs[]>(props.initialCourses);
  const [notes, setNotes] = useState(props.initialNotes);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const fl = (f: { key: string; label: string }) =>
    FKEY[f.key] ? t(FKEY[f.key]) : f.label;

  const set = (key: NumericField, v: number) =>
    setNumbers((n) => ({ ...n, [key]: Math.max(0, v) }));

  const total = numbers.male + numbers.female;
  const sumOf = (keys: NumericField[]) =>
    keys.reduce((a, k) => a + (numbers[k] || 0), 0);

  const ageSum = sumOf(AGE_FIELDS.map((f) => f.key));
  const natSum = nationalities.reduce((a, n) => a + (n.count || 0), 0);
  const classSum = sumOf(CLASS_FIELDS.map((f) => f.key));
  const levelSum = sumOf(LEVEL_FIELDS.map((f) => f.key));
  const deliverySum = sumOf(DELIVERY_FIELDS.map((f) => f.key));

  const issues = useMemo(() => {
    if (total === 0) return [];
    const checks = [
      { label: t("sec.ages"), sum: ageSum },
      { label: t("sec.nationalities"), sum: natSum },
      { label: t("sec.classType"), sum: classSum },
      { label: t("sec.levels"), sum: levelSum },
      { label: t("sec.delivery"), sum: deliverySum },
    ];
    return checks
      .filter((c) => c.sum !== total)
      .map((c) => ({ ...c, diff: c.sum - total }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, ageSum, natSum, classSum, levelSum, deliverySum, props.period]);

  function save() {
    setSaved(false);
    startSaving(async () => {
      await saveReport({
        branchId: props.branchId,
        period: props.period,
        numbers,
        nationalities,
        courses,
        notes,
      });
      setSaved(true);
      router.refresh();
    });
  }

  const badge = (sum: number) => <MatchBadge sum={sum} total={total} t={t} />;

  return (
    <div className="min-h-screen pb-28">
      <div className="p-4 lg:p-8 space-y-5 mx-auto w-full max-w-[1400px]">
        {/* Heading + month picker */}
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <span className="size-10 rounded-xl bg-brand-50 grid place-items-center text-brand">
              <IconPin />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-ink leading-tight">
                {props.branchName}
              </h1>
              <p className="text-xs text-ink-soft">{t("entry.subtitle")}</p>
            </div>
          </div>
          <MonthPicker
            value={props.period}
            onChange={(p) => router.push(`/entry?period=${p}`)}
          />
        </div>

        {/* Total + validation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-navy text-white p-5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">{t("entry.total")}</p>
              <p className="text-4xl font-extrabold mt-1">{total}</p>
              <p className="text-white/50 text-[11px] mt-1">
                = {t("f.male")} {numbers.male} + {t("f.female")} {numbers.female}
              </p>
            </div>
            <div className="size-12 rounded-full bg-white/10 grid place-items-center">
              <IconUsers />
            </div>
          </div>

          <div className="lg:col-span-2">
            {total === 0 ? (
              <div className="card h-full p-4 flex items-center gap-3 text-ink-soft">
                <IconUsers className="text-brand" />
                {t("entry.startHint")}
              </div>
            ) : issues.length === 0 ? (
              <div className="h-full rounded-2xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
                <span className="size-10 rounded-full bg-success/15 grid place-items-center text-success shrink-0">
                  <IconCheck />
                </span>
                <div>
                  <p className="font-bold text-success">{t("entry.allMatch")}</p>
                  <p className="text-sm text-ink-soft">
                    {t("entry.allMatchSub")} ({total}).
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-2xl border border-warning/40 bg-warning/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconWarning className="text-warning" />
                  <p className="font-bold text-warning">
                    {issues.length} {t("entry.mismatch")} ({total})
                  </p>
                </div>
                <ul className="space-y-1 text-sm">
                  {issues.map((c) => (
                    <li key={c.label} className="flex items-center gap-2">
                      <span className="text-ink-soft">•</span>
                      <span className="font-bold text-ink">{c.label}:</span>
                      <span className="text-ink-soft">
                        {t("entry.sum")} {c.sum} (
                        {c.diff > 0
                          ? `${t("entry.over")} ${c.diff}`
                          : `${t("entry.under")} ${-c.diff}`}
                        )
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-ink-soft mt-2">{t("entry.advisory")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gender */}
        <Section icon={<IconUsers className="text-brand" />} title={t("sec.gender")}>
          <div className="grid grid-cols-2 gap-4">
            {GENDER_FIELDS.map((f) => (
              <div key={f.key}>
                <div className="text-sm text-ink-soft mb-1">{fl(f)}</div>
                <NumberBox value={numbers[f.key]} onChange={(v) => set(f.key, v)} />
              </div>
            ))}
          </div>
        </Section>

        {/* Ages */}
        <Section icon={<IconUsers className="text-brand" />} title={t("sec.ages")} badge={badge(ageSum)}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {AGE_FIELDS.map((f) => (
              <NumberBox
                key={f.key}
                label={f.label}
                value={numbers[f.key]}
                onChange={(v) => set(f.key, v)}
                invalid={total > 0 && ageSum !== total}
              />
            ))}
          </div>
        </Section>

        {/* Nationalities */}
        <Section icon={<IconGlobe className="text-brand" />} title={t("sec.nationalities")} badge={badge(natSum)}>
          {props.presetNationalities && props.presetNationalities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {props.presetNationalities
                .filter((name) => !nationalities.some((n) => n.name === name))
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setNationalities((l) => [...l, { name, count: 0 }])}
                    className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-50 px-3 py-1 text-sm font-bold text-brand hover:bg-brand hover:text-white transition"
                  >
                    <IconPlus width={14} height={14} /> {name}
                  </button>
                ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nationalities.map((n, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-canvas p-2">
                <input
                  value={n.name}
                  placeholder={t("f.nationality")}
                  onChange={(e) =>
                    setNationalities((l) =>
                      l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                    )
                  }
                  className="field flex-1 min-w-0 bg-card"
                />
                <div className="w-20 shrink-0">
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
                  onClick={() => setNationalities((l) => l.filter((_, j) => j !== i))}
                  className="text-danger p-1.5 hover:bg-danger-50 rounded-lg shrink-0"
                  aria-label={t("entry.addNationality")}
                >
                  <IconTrash width={18} height={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNationalities((l) => [...l, { name: "", count: 0 }])}
              className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line p-2.5 text-sm font-bold text-ink-soft hover:border-brand hover:text-brand transition"
            >
              <IconPlus width={16} height={16} /> {t("entry.addNationality")}
            </button>
          </div>
        </Section>

        {/* Class + Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Section icon={<IconPin className="text-brand" />} title={t("sec.classType")} badge={badge(classSum)}>
            <div className="space-y-3">
              {CLASS_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink">{fl(f)}</span>
                  <div className="w-24 shrink-0">
                    <NumberBox value={numbers[f.key]} onChange={(v) => set(f.key, v)} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<IconBook className="text-brand" />} title={t("sec.courses")}>
            <div className="space-y-3">
              {courses.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={c.name}
                    placeholder={t("f.courseName")}
                    onChange={(e) =>
                      setCourses((l) =>
                        l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    className="field flex-1 min-w-0"
                  />
                  <select
                    value={c.type}
                    onChange={(e) =>
                      setCourses((l) =>
                        l.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)),
                      )
                    }
                    className="field w-28 shrink-0"
                  >
                    {COURSE_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {t(`ct.${ct}`)}
                      </option>
                    ))}
                  </select>
                  <div className="w-16 shrink-0">
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
                    onClick={() => setCourses((l) => l.filter((_, j) => j !== i))}
                    className="text-danger p-1.5 hover:bg-danger-50 rounded-lg shrink-0"
                    aria-label={t("entry.addCourse")}
                  >
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setCourses((l) => [...l, { name: "", type: "GENERAL_ENGLISH", count: 0 }])
                }
                className="flex items-center justify-center gap-1 w-full rounded-xl border-2 border-dashed border-line p-2.5 text-sm font-bold text-ink-soft hover:border-brand hover:text-brand transition"
              >
                <IconPlus width={16} height={16} /> {t("entry.addCourse")}
              </button>
            </div>
          </Section>
        </div>

        {/* Levels */}
        <Section icon={<IconBook className="text-brand" />} title={t("sec.levels")} badge={badge(levelSum)}>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
            {LEVEL_FIELDS.map((f) => (
              <NumberBox
                key={f.key}
                label={f.label}
                value={numbers[f.key]}
                onChange={(v) => set(f.key, v)}
                invalid={total > 0 && levelSum !== total}
              />
            ))}
          </div>
        </Section>

        {/* Delivery + Renewals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Section icon={<IconPin className="text-brand" />} title={t("sec.delivery")} badge={badge(deliverySum)}>
            <div className="grid grid-cols-3 gap-3">
              {DELIVERY_FIELDS.map((f) => (
                <NumberBox
                  key={f.key}
                  label={fl(f)}
                  value={numbers[f.key]}
                  onChange={(v) => set(f.key, v)}
                  invalid={total > 0 && deliverySum !== total}
                />
              ))}
            </div>
          </Section>

          <Section icon={<IconRefresh className="text-brand" />} title={t("sec.renewals")}>
            <div className="flex items-center gap-4">
              <div className="w-32">
                <NumberBox
                  label={t("entry.renewalCount")}
                  value={numbers.renewals}
                  onChange={(v) => set("renewals", v)}
                />
              </div>
              {total > 0 && (
                <div className="rounded-xl bg-brand-50 px-4 py-2 text-center">
                  <p className="text-2xl font-extrabold text-brand">
                    {Math.round((numbers.renewals / total) * 100)}%
                  </p>
                  <p className="text-[11px] text-ink-soft">{t("entry.renewalRate")}</p>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Notes */}
        <Section icon={<IconBook className="text-brand" />} title={t("sec.notes")}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("entry.notesPlaceholder")}
            className="field w-full resize-y"
          />
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-line px-6 lg:px-8 py-3 flex items-center justify-between gap-4 no-print z-20">
        <p className="text-sm text-ink-soft">
          {props.updatedAt
            ? `${t("entry.lastSaved")}: ${new Date(props.updatedAt).toLocaleString()}`
            : t("entry.notSaved")}
          {saved && <span className="text-success font-bold mr-2">{t("entry.saved")}</span>}
        </p>
        <button onClick={save} disabled={saving} className="btn-dark">
          <IconSave />
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-extrabold text-ink">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function MatchBadge({
  sum,
  total,
  t,
}: {
  sum: number;
  total: number;
  t: (k: string) => string;
}) {
  if (total === 0) return null;
  if (sum === total) {
    return (
      <span className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2.5 py-1 rounded-full">
        <IconCheck width={14} height={14} /> {t("badge.match")} ({total})
      </span>
    );
  }
  const diff = sum - total;
  return (
    <span className="flex items-center gap-1 text-warning text-xs font-bold bg-warning/10 px-2.5 py-1 rounded-full">
      <IconWarning width={14} height={14} />
      {sum} / {total} ({diff > 0 ? `+${diff}` : diff})
    </span>
  );
}
