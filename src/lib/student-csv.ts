// Parse a per-student roster CSV (one row = one student) and aggregate it into
// monthly report figures, grouped by period (YYYY-MM) derived from the Date.

import { type ReportNumbers, emptyNumbers } from "@/lib/fields";

export type ReportExtras = {
  consultants: Record<string, number>;
  instructors: Record<string, number>;
  packages: { hours: number; levels: number; both: number; unknown: number };
  byDay: Record<string, number>;
};

export type AggregatedRow = {
  period: string;
  numbers: ReportNumbers;
  nationalities: { name: string; count: number }[];
  courses: { name: string; type: string; count: number }[];
  extras: ReportExtras;
};

export type DetectedColumn = {
  key: string; // logical field
  labelKey: string; // i18n key for display
  header: string | null; // matched CSV header, or null if not found
  critical: boolean; // import fails without it
};

// Logical columns we look for, with header aliases (matched case-insensitively
// by exact-then-contains). Order here also defines display order.
const COLUMN_SPECS: {
  key: keyof typeof EMPTY_CI;
  labelKey: string;
  critical: boolean;
  needles: string[];
}[] = [
  { key: "date", labelKey: "csv.date", critical: true, needles: ["date", "enrollment date", "تاريخ", "التاريخ"] },
  { key: "gender", labelKey: "csv.gender", critical: true, needles: ["gender", "sex", "m/f", "النوع", "الجنس", "جنس"] },
  { key: "age", labelKey: "csv.age", critical: false, needles: ["date of birth", "dob", "d.o.b", "birth", "age", "year", "العمر", "عمر", "ميلاد", "مواليد", "السن"] },
  { key: "nat", labelKey: "csv.nat", critical: false, needles: ["nationality", "الجنسية", "جنسية"] },
  { key: "course", labelKey: "csv.course", critical: false, needles: ["course", "program", "الدورة", "كورس", "البرنامج"] },
  { key: "cls", labelKey: "csv.cls", critical: false, needles: ["class type", "class", "نوع الفصل", "فصل"] },
  { key: "level", labelKey: "csv.level", critical: false, needles: ["level", "المستوى", "مستوى"] },
  { key: "delivery", labelKey: "csv.delivery", critical: false, needles: ["home, on site", "online / onsite", "on site", "onsite", "online", "الحضور", "attendance", "طريقة الحضور"] },
  { key: "renewal", labelKey: "csv.renewal", critical: false, needles: ["renewal", "renew", "تجديد"] },
  { key: "consultant", labelKey: "csv.consultant", critical: false, needles: ["educational consultant", "consultant", "sales", "مستشار", "موظف"] },
  { key: "instructor", labelKey: "csv.instructor", critical: false, needles: ["instructor", "teacher", "مدرب", "مدرّس", "مدرس", "معلم"] },
  { key: "pkg", labelKey: "csv.pkg", critical: false, needles: ["hours/levels", "hours", "levels", "package", "باقة"] },
];

const EMPTY_CI = {
  date: -1,
  gender: -1,
  age: -1,
  nat: -1,
  course: -1,
  cls: -1,
  level: -1,
  delivery: -1,
  renewal: -1,
  consultant: -1,
  instructor: -1,
  pkg: -1,
};

/** Minimal RFC-4180-ish CSV parser (handles quotes and commas in fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const norm = (v: string) => (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

function findCol(headers: string[], ...needles: string[]) {
  const h = headers.map(norm);
  // Prefer an exact header match (so "Level" wins over "Hours/Levels").
  for (let i = 0; i < h.length; i++) {
    if (needles.some((n) => h[i] === n)) return i;
  }
  for (let i = 0; i < h.length; i++) {
    if (needles.some((n) => h[i].includes(n))) return i;
  }
  return -1;
}

function periodFromDate(raw: string): string | null {
  const s = (raw || "").trim();
  if (!s) return null;
  // Expected D/M/YYYY (e.g. 14/2/2026)
  const m = s.match(/(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2,4})/);
  if (!m) return null;
  let [, , month, year] = m;
  if (year.length === 2) year = "20" + year;
  const mm = String(parseInt(month, 10)).padStart(2, "0");
  if (parseInt(mm, 10) < 1 || parseInt(mm, 10) > 12) return null;
  return `${year}-${mm}`;
}

function ageBucket(age: number): keyof ReportNumbers | null {
  if (!Number.isFinite(age) || age <= 0) return null;
  if (age <= 12) return "ageKids";
  if (age <= 18) return "ageTeens";
  if (age <= 30) return "ageYoungAdults";
  if (age <= 50) return "ageAdults";
  return "ageSeniors";
}

function classKey(raw: string): keyof ReportNumbers {
  const v = norm(raw);
  if (v.includes("+")) return "classOther"; // e.g. "Group + VIP"
  if (v.includes("vip")) return "classVipAdult";
  if (v.includes("kid")) return "classVipKid";
  if (v.includes("group")) return "classGroupAdult";
  return "classOther";
}

function levelKey(raw: string): keyof ReportNumbers | null {
  const v = norm(raw);
  if (v.includes("foundation")) return "levelFoundation";
  const m = v.match(/(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 9) return (`level${n}` as keyof ReportNumbers);
  }
  return null; // "Unknown" or empty
}

function deliveryKey(raw: string): keyof ReportNumbers | null {
  const v = norm(raw);
  if (v.includes("online")) return "online";
  if (v.includes("home")) return "home";
  if (v.includes("site") || v.includes("onsite")) return "onsite";
  return null;
}

function genderKey(raw: string): "male" | "female" | null {
  const v = norm(raw);
  if (!v) return null;
  // Accepts "F"/"M" as well as "Female"/"Male" (with stray spaces) and Arabic.
  if (v === "f" || v.startsWith("female") || v.includes("أنث") || v.includes("انث"))
    return "female";
  if (v === "m" || v.startsWith("male") || v.includes("ذكر")) return "male";
  return null;
}

/** Extract a plausible birth year from either a bare year (1987) or a full
 *  date of birth (15/12/1996, 1996-12-15, …). */
function birthYear(raw: string): number | null {
  const groups = (raw || "").match(/\d{4}/g);
  const now = new Date().getFullYear();
  if (groups) {
    for (const g of groups) {
      const y = parseInt(g, 10);
      if (y >= 1900 && y <= now) return y;
    }
    return null;
  }
  // Fallback: a 2-digit year or other digits.
  const n = parseInt((raw || "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 1900 && n <= now ? n : null;
}

function courseInfo(raw: string): { name: string; type: string } | null {
  const v = norm(raw);
  if (!v) return null;
  if (v === "ge" || v.includes("general")) return { name: "General English", type: "GENERAL_ENGLISH" };
  if (v.includes("ielts")) return { name: "IELTS", type: "TEST_PREP" };
  if (v.includes("toefl")) return { name: "TOEFL", type: "TEST_PREP" };
  if (v.includes("business")) return { name: "Business English", type: "OTHER" };
  if (v.includes("school")) return { name: "School Subjects", type: "OTHER" };
  return { name: raw.trim(), type: "OTHER" };
}

export function aggregateStudentCsv(text: string): {
  rows: AggregatedRow[];
  totalStudents: number;
  skipped: number;
  detected: DetectedColumn[];
} {
  const grid = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (grid.length < 2)
    return { rows: [], totalStudents: 0, skipped: 0, detected: [] };

  const headers = grid[0];
  const ci = { ...EMPTY_CI };
  const detected: DetectedColumn[] = COLUMN_SPECS.map((spec) => {
    const idx = findCol(headers, ...spec.needles);
    ci[spec.key] = idx;
    return {
      key: spec.key,
      labelKey: spec.labelKey,
      header: idx >= 0 ? (headers[idx] ?? "").trim() : null,
      critical: spec.critical,
    };
  });

  const byPeriod = new Map<
    string,
    {
      numbers: ReportNumbers;
      nats: Map<string, number>;
      courses: Map<string, { type: string; count: number }>;
      consultants: Map<string, number>;
      instructors: Map<string, number>;
      packages: { hours: number; levels: number; both: number; unknown: number };
      byDay: Map<string, number>;
    }
  >();

  let totalStudents = 0;
  let skipped = 0;

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const gender = genderKey(ci.gender >= 0 ? row[ci.gender] : "");
    // Skip rows that aren't real enrolled students (no gender = unpaid/placement)
    if (!gender) {
      skipped++;
      continue;
    }
    const period = ci.date >= 0 ? periodFromDate(row[ci.date]) : null;
    if (!period) {
      skipped++;
      continue;
    }

    if (!byPeriod.has(period)) {
      byPeriod.set(period, {
        numbers: emptyNumbers(),
        nats: new Map(),
        courses: new Map(),
        consultants: new Map(),
        instructors: new Map(),
        packages: { hours: 0, levels: 0, both: 0, unknown: 0 },
        byDay: new Map(),
      });
    }
    const acc = byPeriod.get(period)!;
    totalStudents++;

    // gender
    if (gender === "male") acc.numbers.male++;
    else acc.numbers.female++;

    // age (column holds a birth year or a full date of birth)
    if (ci.age >= 0) {
      const yr = birthYear(row[ci.age]);
      const periodYear = parseInt(period.slice(0, 4), 10);
      if (yr && yr <= periodYear) {
        const b = ageBucket(periodYear - yr);
        if (b) acc.numbers[b]++;
      }
    }

    // class type
    if (ci.cls >= 0 && row[ci.cls]?.trim()) acc.numbers[classKey(row[ci.cls])]++;
    // level
    if (ci.level >= 0) {
      const lk = levelKey(row[ci.level]);
      if (lk) acc.numbers[lk]++;
    }
    // delivery
    if (ci.delivery >= 0) {
      const dk = deliveryKey(row[ci.delivery]);
      if (dk) acc.numbers[dk]++;
    }
    // renewal
    if (ci.renewal >= 0 && norm(row[ci.renewal]) === "yes") acc.numbers.renewals++;

    // nationality
    if (ci.nat >= 0 && row[ci.nat]?.trim()) {
      const name = row[ci.nat].trim();
      acc.nats.set(name, (acc.nats.get(name) ?? 0) + 1);
    }
    // course
    if (ci.course >= 0) {
      const info = courseInfo(row[ci.course]);
      if (info) {
        const existing = acc.courses.get(info.name);
        acc.courses.set(info.name, {
          type: info.type,
          count: (existing?.count ?? 0) + 1,
        });
      }
    }

    // consultant (sales rep)
    if (ci.consultant >= 0 && row[ci.consultant]?.trim()) {
      const name = row[ci.consultant].trim();
      acc.consultants.set(name, (acc.consultants.get(name) ?? 0) + 1);
    }
    // instructor (teacher)
    if (ci.instructor >= 0 && row[ci.instructor]?.trim()) {
      const name = row[ci.instructor].trim();
      acc.instructors.set(name, (acc.instructors.get(name) ?? 0) + 1);
    }
    // package type (Hours vs Levels)
    if (ci.pkg >= 0) {
      const v = norm(row[ci.pkg]);
      const hasHr = /\bhr|hour/.test(v);
      const hasLvl = /level/.test(v);
      if (hasHr && hasLvl) acc.packages.both++;
      else if (hasHr) acc.packages.hours++;
      else if (hasLvl) acc.packages.levels++;
      else acc.packages.unknown++;
    }
    // enrollment day-of-month
    if (ci.date >= 0) {
      const dm = (row[ci.date] || "").match(/(\d{1,2})/);
      if (dm) {
        const day = String(parseInt(dm[1], 10));
        acc.byDay.set(day, (acc.byDay.get(day) ?? 0) + 1);
      }
    }
  }

  const rows: AggregatedRow[] = [...byPeriod.entries()].map(([period, a]) => ({
    period,
    numbers: a.numbers,
    nationalities: [...a.nats.entries()].map(([name, count]) => ({ name, count })),
    courses: [...a.courses.entries()].map(([name, v]) => ({
      name,
      type: v.type,
      count: v.count,
    })),
    extras: {
      consultants: Object.fromEntries(a.consultants),
      instructors: Object.fromEntries(a.instructors),
      packages: a.packages,
      byDay: Object.fromEntries(a.byDay),
    },
  }));

  return { rows, totalStudents, skipped, detected };
}
