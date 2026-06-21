// Parse a per-student roster CSV (one row = one student) and aggregate it into
// monthly report figures, grouped by period (YYYY-MM) derived from the Date.

import { type ReportNumbers, emptyNumbers } from "@/lib/fields";

export type AggregatedRow = {
  period: string;
  numbers: ReportNumbers;
  nationalities: { name: string; count: number }[];
  courses: { name: string; type: string; count: number }[];
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
} {
  const grid = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (grid.length < 2) return { rows: [], totalStudents: 0, skipped: 0 };

  const headers = grid[0];
  const ci = {
    date: findCol(headers, "date", "تاريخ"),
    age: findCol(headers, "age", "birth", "year", "عمر", "ميلاد"),
    gender: findCol(headers, "gender", "النوع", "جنس"),
    nat: findCol(headers, "nationality", "الجنسية", "جنسية"),
    course: findCol(headers, "course", "الدورة", "كورس"),
    cls: findCol(headers, "class type", "class", "نوع الفصل", "فصل"),
    level: findCol(headers, "level", "المستوى", "مستوى"),
    delivery: findCol(headers, "home, on site", "on site", "online", "الحضور", "attendance"),
    renewal: findCol(headers, "renewal", "تجديد"),
  };

  const byPeriod = new Map<
    string,
    { numbers: ReportNumbers; nats: Map<string, number>; courses: Map<string, { type: string; count: number }> }
  >();

  let totalStudents = 0;
  let skipped = 0;

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const gender = norm(ci.gender >= 0 ? row[ci.gender] : "");
    // Skip rows that aren't real enrolled students (no gender = unpaid/placement)
    if (gender !== "m" && gender !== "f") {
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
      });
    }
    const acc = byPeriod.get(period)!;
    totalStudents++;

    // gender
    if (gender === "m") acc.numbers.male++;
    else acc.numbers.female++;

    // age (column holds birth year)
    if (ci.age >= 0) {
      const yr = parseInt((row[ci.age] || "").replace(/\D/g, ""), 10);
      const periodYear = parseInt(period.slice(0, 4), 10);
      if (Number.isFinite(yr) && yr > 1900 && yr <= periodYear) {
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
  }));

  return { rows, totalStudents, skipped };
}
