"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { startPasswordReset, completePasswordReset } from "@/app/actions/users";
import { useT } from "@/components/i18n";

type Step = "request" | "code" | "manual" | "done";

export function ForgotForm() {
  const { t } = useT();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await startPasswordReset(email);
      if (!res.ok) {
        setError(res.error ?? "حصل خطأ");
        return;
      }
      setStep(res.mode === "code" ? "code" : "manual");
    });
  }

  function complete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await completePasswordReset(code, newPassword);
      if (!res.ok) {
        setError(res.error ?? "حصل خطأ");
        return;
      }
      setStep("done");
    });
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h2 className="text-2xl font-extrabold text-ink mb-1">{t("fp.title")}</h2>
      <p className="text-ink-soft text-sm mb-6">
        {step === "code" ? t("fp.codeSent") : t("fp.subtitle")}
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-danger-50 border border-danger/30 px-4 py-2.5 text-danger text-sm">
          {error}
        </div>
      )}

      {step === "manual" && (
        <div className="rounded-xl bg-success/10 text-success p-4 text-sm font-bold">
          {t("fp.sent")}
        </div>
      )}

      {step === "done" && (
        <div className="rounded-xl bg-success/10 text-success p-4 text-sm font-bold">
          {t("fp.resetDone")}
        </div>
      )}

      {step === "request" && (
        <form onSubmit={requestReset}>
          <label className="block text-sm font-bold text-ink mb-1.5">{t("login.email")}</label>
          <input
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@ienglish.com"
            className="field text-left mb-4"
          />
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? t("saving") : t("fp.submit")}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={complete} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">{t("fp.code")}</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="------"
              dir="ltr"
              className="field text-center tracking-[0.5em] text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">{t("fp.newPassword")}</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              dir="ltr"
              className="field text-left"
            />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? t("saving") : t("fp.setPassword")}
          </button>
        </form>
      )}

      <div className="my-5 h-px bg-line" />
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand font-bold">
          {t("fp.back")}
        </Link>
      </p>
    </div>
  );
}
