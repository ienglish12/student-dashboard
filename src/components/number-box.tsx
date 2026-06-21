"use client";

/**
 * Clean numeric input — no spinner arrows. Selects all on focus so the
 * employee can just type the value quickly.
 */
export function NumberBox({
  value,
  onChange,
  label,
  invalid,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  invalid?: boolean;
}) {
  return (
    <div>
      {label && (
        <div className="text-xs text-ink-soft mb-1 text-center">{label}</div>
      )}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => {
          const n = parseInt(e.target.value || "0", 10);
          onChange(Number.isFinite(n) && n > 0 ? n : 0);
        }}
        onFocus={(e) => e.target.select()}
        className={`w-full rounded-xl border bg-canvas px-3 py-2.5 text-center font-bold text-ink outline-none transition focus:bg-card ${
          invalid
            ? "border-danger/50 focus:border-danger"
            : "border-line focus:border-brand"
        }`}
      />
    </div>
  );
}
