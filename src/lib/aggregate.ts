// Dashboard aggregation — exact formulas from SPEC §5.

import {
  AGE_MIDPOINTS,
  AGE_FIELDS,
  CLASS_FIELDS,
  LEVEL_FIELDS,
  DELIVERY_FIELDS,
  type NumericField,
} from "@/lib/fields";

export type ReportWithRelations = {
  branchId: string;
  branch: { id: string; name: string };
  nationalities: { name: string; count: number }[];
  courses: { name: string; type: string; count: number }[];
  extras?: string;
} & Record<NumericField, number>;

export type BranchRef = { id: string; name: string };

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

const sum = (r: ReportWithRelations, keys: NumericField[]) =>
  keys.reduce((a, k) => a + (r[k] || 0), 0);

const reportTotal = (r: ReportWithRelations) => r.male + r.female;

export function aggregate(
  reports: ReportWithRelations[],
  allBranches: BranchRef[],
) {
  // A report "counts" only if total > 0 (SPEC §5).
  const valid = reports.filter((r) => reportTotal(r) > 0);

  const total = valid.reduce((a, r) => a + reportTotal(r), 0);
  const male = valid.reduce((a, r) => a + r.male, 0);
  const female = valid.reduce((a, r) => a + r.female, 0);

  const submittedIds = new Set(valid.map((r) => r.branchId));
  const missing = allBranches.filter((b) => !submittedIds.has(b.id));
  const branchOrder = new Map(allBranches.map((b, index) => [b.id, index]));

  // ---- Estimated average age (weighted by bucket midpoints) ----
  const ageWeighted = (r: ReportWithRelations) =>
    AGE_FIELDS.reduce((a, f) => a + r[f.key] * AGE_MIDPOINTS[f.key], 0);
  const ageCount = (r: ReportWithRelations) => sum(r, AGE_FIELDS.map((f) => f.key));

  const overallAgeW = valid.reduce((a, r) => a + ageWeighted(r), 0);
  const overallAgeC = valid.reduce((a, r) => a + ageCount(r), 0);
  const avgAge = overallAgeC > 0 ? overallAgeW / overallAgeC : 0;

  // ---- Per-branch breakdown ----
  const byBranch = valid
    .map((r) => {
      const t = reportTotal(r);
      const classSum = sum(r, CLASS_FIELDS.map((f) => f.key));
      const deliverySum = sum(r, DELIVERY_FIELDS.map((f) => f.key));
      const courseSum = r.courses.reduce((a, c) => a + c.count, 0);
      const general = r.courses
        .filter((c) => c.type === "GENERAL_ENGLISH")
        .reduce((a, c) => a + c.count, 0);

      const ac = ageCount(r);
      return {
        branchId: r.branchId,
        name: r.branch.name,
        total: t,
        share: pct(t, total),
        avgAge: ac > 0 ? Math.round((ageWeighted(r) / ac) * 10) / 10 : 0,
        uniqueNationalities: r.nationalities.filter((n) => n.count > 0).length,
        courseVariety: r.courses.filter((c) => c.count > 0).length,
        courseSplit: {
          general: pct(general, courseSum),
          testPrepOther: pct(courseSum - general, courseSum),
        },
        classPct: Object.fromEntries(
          CLASS_FIELDS.map((f) => [f.key, pct(r[f.key], classSum)]),
        ),
        deliveryPct: Object.fromEntries(
          DELIVERY_FIELDS.map((f) => [f.key, pct(r[f.key], deliverySum)]),
        ),
        renewals: r.renewals,
        renewalRate: pct(r.renewals, t),
      };
    })
    .sort(
      (a, b) =>
        (branchOrder.get(a.branchId) ?? Number.MAX_SAFE_INTEGER) -
        (branchOrder.get(b.branchId) ?? Number.MAX_SAFE_INTEGER),
    );

  // ---- Top nationalities (sum by name, top 8) ----
  const natMap = new Map<string, number>();
  for (const r of valid) {
    for (const n of r.nationalities) {
      if (n.count > 0) natMap.set(n.name, (natMap.get(n.name) ?? 0) + n.count);
    }
  }
  const natTotal = [...natMap.values()].reduce((a, c) => a + c, 0);
  const topNationalities = [...natMap.entries()]
    .map(([name, count]) => ({ name, count, pct: pct(count, natTotal) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ---- Age groups overall (%) ----
  const ageGroups = AGE_FIELDS.map((f) => {
    const c = valid.reduce((a, r) => a + r[f.key], 0);
    return { key: f.key, label: f.label, count: c, pct: pct(c, total) };
  });

  // ---- Levels overall (sorted desc) ----
  const levels = LEVEL_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    count: valid.reduce((a, r) => a + r[f.key], 0),
  })).sort((a, b) => b.count - a.count);

  // ---- Delivery overall (%) ----
  const deliveryOverall = DELIVERY_FIELDS.map((f) => {
    const c = valid.reduce((a, r) => a + r[f.key], 0);
    return { key: f.key, label: f.label, count: c, pct: pct(c, total) };
  });

  // ---- Class types overall (%) ----
  const classSumAll = valid.reduce(
    (a, r) => a + sum(r, CLASS_FIELDS.map((f) => f.key)),
    0,
  );
  const classOverall = CLASS_FIELDS.map((f) => {
    const c = valid.reduce((a, r) => a + r[f.key], 0);
    return { key: f.key, count: c, pct: pct(c, classSumAll) };
  });

  // ---- Courses overall (top by name + type split) ----
  const courseMap = new Map<string, { type: string; count: number }>();
  for (const r of valid) {
    for (const c of r.courses) {
      if (c.count <= 0) continue;
      const e = courseMap.get(c.name);
      courseMap.set(c.name, {
        type: c.type,
        count: (e?.count ?? 0) + c.count,
      });
    }
  }
  const courseSumAll = [...courseMap.values()].reduce((a, c) => a + c.count, 0);
  const topCourses = [...courseMap.entries()]
    .map(([name, v]) => ({ name, type: v.type, count: v.count, pct: pct(v.count, courseSumAll) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const courseTypeSplit = {
    general: [...courseMap.values()].filter((c) => c.type === "GENERAL_ENGLISH").reduce((a, c) => a + c.count, 0),
    testPrep: [...courseMap.values()].filter((c) => c.type === "TEST_PREP").reduce((a, c) => a + c.count, 0),
    other: [...courseMap.values()].filter((c) => c.type === "OTHER").reduce((a, c) => a + c.count, 0),
  };

  // ---- Renewals overall ----
  const totalRenewals = valid.reduce((a, r) => a + r.renewals, 0);
  const renewalRate = pct(totalRenewals, total);

  // ---- Extra analytics merged from roster imports (consultants/packages/byDay) ----
  const consultantMap = new Map<string, number>();
  const packages = { hours: 0, levels: 0, both: 0, unknown: 0 };
  const byDayMap = new Map<number, number>();
  for (const r of valid) {
    if (!r.extras) continue;
    try {
      const e = JSON.parse(r.extras) as {
        consultants?: Record<string, number>;
        packages?: { hours: number; levels: number; both: number; unknown: number };
        byDay?: Record<string, number>;
      };
      for (const [name, c] of Object.entries(e.consultants ?? {}))
        consultantMap.set(name, (consultantMap.get(name) ?? 0) + c);
      if (e.packages) {
        packages.hours += e.packages.hours || 0;
        packages.levels += e.packages.levels || 0;
        packages.both += e.packages.both || 0;
        packages.unknown += e.packages.unknown || 0;
      }
      for (const [day, c] of Object.entries(e.byDay ?? {}))
        byDayMap.set(+day, (byDayMap.get(+day) ?? 0) + c);
    } catch {
      /* ignore malformed extras */
    }
  }
  const consultants = [...consultantMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const byDay = [...byDayMap.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day - b.day);
  const hasExtras =
    consultants.length > 0 ||
    byDay.length > 0 ||
    packages.hours + packages.levels + packages.both > 0;

  // ---- Auto insights (SPEC §5) ----
  const highest = [...byBranch].sort((a, b) => b.total - a.total)[0] ?? null;
  const lowest = [...byBranch].sort((a, b) => a.total - b.total)[0] ?? null;
  const mostDiverse = [...byBranch].sort(
    (a, b) => b.uniqueNationalities - a.uniqueNationalities,
  )[0] ?? null;
  const bestRetention = [...byBranch].sort(
    (a, b) => b.renewalRate - a.renewalRate,
  )[0] ?? null;

  return {
    counts: {
      total,
      male,
      female,
      malePct: pct(male, total),
      femalePct: pct(female, total),
      avgAge: Math.round(avgAge * 10) / 10,
      renewalRate,
      submitted: valid.length,
      branches: allBranches.length,
      missingCount: missing.length,
      missing: missing.map((b) => b.name),
    },
    byBranch,
    topNationalities,
    ageGroups,
    levels,
    deliveryOverall,
    classOverall,
    topCourses,
    courseTypeSplit,
    extras: { consultants, packages, byDay, hasExtras },
    insights: {
      highest,
      lowest,
      mostDiverse,
      bestRetention,
    },
  };
}

export type Aggregated = ReturnType<typeof aggregate>;
