"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importStudentSheet } from "@/app/actions/branches";
import { useT } from "@/components/i18n";
import { IconUpload } from "@/components/icons";
import { ImportSummary, type DetectedColumn } from "@/components/import-summary";

export function ImportClient({ branches }: { branches: { id: string; name: string }[] }) {
  const router = useRouter();
  const { t } = useT();
  const [pending, start] = useTransition();
  const [impBranch, setImpBranch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [cols, setCols] = useState<DetectedColumn[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setOk(false);
    if (!impBranch) {
      setMsg(t("imp.pickFirst"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    try {
      const text = await file.text();
      start(async () => {
        try {
          const res = await importStudentSheet(impBranch, text, file.name);
          setCols(res.columns ?? []);
          if (!res.ok) {
            setMsg(t("imp.noData"));
          } else {
            setOk(true);
            setMsg(
              `✓ ${res.totalStudents} ${t("rep.student")} · ${res.periods.join("، ")}` +
                (res.skipped ? ` (${res.skipped} ${t("imp.skipped")})` : ""),
            );
          }
          router.refresh();
        } catch (err) {
          setMsg(err instanceof Error ? err.message : t("imp.failed"));
        }
      });
    } catch {
      setMsg(t("imp.failed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[820px]">
        <div className="flex items-center gap-2.5">
          <span className="size-10 rounded-xl bg-brand-50 grid place-items-center text-brand">
            <IconUpload />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink leading-tight">{t("imp.title")}</h1>
            <p className="text-xs text-ink-soft">{t("imp.subtitle")}</p>
          </div>
        </div>

        <section className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">{t("imp.branch")}</label>
            <select
              value={impBranch}
              onChange={(e) => setImpBranch(e.target.value)}
              className="field w-full"
            >
              <option value="">{t("set.chooseBranch")}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={pending || !impBranch}
            className="w-full rounded-2xl border-2 border-dashed border-line p-10 text-center hover:border-brand transition disabled:opacity-50"
          >
            <IconUpload className="mx-auto text-brand mb-3" width={36} height={36} />
            <p className="font-bold text-ink">{pending ? t("saving") : t("imp.choose")}</p>
            <p className="text-xs text-ink-soft mt-1">CSV</p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />

          {msg && (
            <p
              className={`text-sm rounded-xl p-3 ${
                ok ? "bg-success/10 text-success" : "bg-canvas text-ink"
              }`}
            >
              {msg}
            </p>
          )}
        </section>

        {cols.length > 0 && <ImportSummary columns={cols} />}

        <div className="card p-5 text-sm text-ink-soft leading-relaxed">
          <p className="font-bold text-ink mb-2">{t("imp.howTitle")}</p>
          <p>{t("imp.how1")}</p>
          <p>{t("imp.how2")}</p>
          <p>{t("imp.how3")}</p>
        </div>
      </div>
    </div>
  );
}
