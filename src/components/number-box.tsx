"use client";

export function NumberBox({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const set = (v: number) => onChange(Math.max(0, v));
  return (
    <div>
      {label && (
        <div className="text-xs text-ink-soft mb-1 text-center">{label}</div>
      )}
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => set(parseInt(e.target.value || "0", 10))}
          onFocus={(e) => e.target.select()}
          className="num-field pl-7"
        />
        <div className="absolute inset-y-0 left-1 flex flex-col justify-center">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => set(value + 1)}
            className="text-ink-soft hover:text-brand leading-none"
            aria-label="زيادة"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="m6 15 6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => set(value - 1)}
            className="text-ink-soft hover:text-brand leading-none"
            aria-label="نقص"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
