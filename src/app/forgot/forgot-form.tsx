"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/users";
import { useT } from "@/components/i18n";

export function ForgotForm() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await requestPasswordReset(email);
      setDone(true);
    });
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-md p-8">
      <h2 className="text-2xl font-extrabold text-ink mb-1">{t("fp.title")}</h2>
      <p className="text-ink-soft text-sm mb-6">{t("fp.subtitle")}</p>

      {done ? (
        <div className="rounded-xl bg-success/10 text-success p-4 text-sm font-bold">
          {t("fp.sent")}
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="my-5 h-px bg-line" />
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand font-bold">
          {t("fp.back")}
        </Link>
      </p>
    </form>
  );
}
