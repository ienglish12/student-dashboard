"use client";

import { useT, MONTHS } from "@/components/i18n";

/** value/onChange use "YYYY-MM". Renders two friendly dropdowns. */
export function MonthPicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const { lang } = useT();
  const months = MONTHS[lang];
  const [y, m] = value.split("-");
  const year = parseInt(y || "0", 10) || new Date().getFullYear();
  const month = parseInt(m || "1", 10) || 1;

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => thisYear - 4 + i);

  const set = (yy: number, mm: number) =>
    onChange(`${yy}-${String(mm).padStart(2, "0")}`);

  const sel =
    "rounded-xl border border-line bg-canvas px-3 py-2 font-bold text-ink outline-none transition focus:border-brand cursor-pointer";

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={month}
        onChange={(e) => set(year, parseInt(e.target.value, 10))}
        className={sel}
        aria-label="Month"
      >
        {months.map((name, i) => (
          <option key={i} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => set(parseInt(e.target.value, 10), month)}
        className={sel}
        aria-label="Year"
      >
        {years.map((yy) => (
          <option key={yy} value={yy}>
            {yy}
          </option>
        ))}
      </select>
    </div>
  );
}
