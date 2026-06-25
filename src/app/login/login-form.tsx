"use client";

import { useActionState, useState } from "react";
import {
  loginAction,
  verifyTwoFactorAction,
  type LoginState,
} from "@/app/actions/auth";
import { useT } from "@/components/i18n";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [twoState, twoAction, twoPending] = useActionState<LoginState, FormData>(
    verifyTwoFactorAction,
    {},
  );
  const [showPass, setShowPass] = useState(false);
  const { t } = useT();

  const inTwoFA = Boolean(state.twofa || twoState.twofa);

  if (inTwoFA) {
    return (
      <form action={twoAction} className="card w-full max-w-md p-8">
        <h2 className="text-2xl font-extrabold text-ink mb-1">{t("login.2faTitle")}</h2>
        <p className="text-ink-soft text-sm mb-6">{t("login.2faSub")}</p>

        {twoState.error && (
          <div className="mb-4 rounded-xl bg-danger-50 border border-danger/30 px-4 py-2.5 text-danger text-sm">
            {twoState.error}
          </div>
        )}

        <label className="block text-sm font-bold text-ink mb-1.5">{t("login.2faCode")}</label>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="------"
          dir="ltr"
          className="field text-center tracking-[0.5em] text-lg mb-4"
          autoFocus
        />

        <button type="submit" disabled={twoPending} className="btn-primary w-full">
          {twoPending ? t("login.submitting") : t("login.2faVerify")}
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 w-full text-sm text-ink-soft font-bold hover:text-ink"
        >
          {t("login.2faBack")}
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="card w-full max-w-md p-8">
      <h2 className="text-2xl font-extrabold text-ink mb-1">{t("login.title")}</h2>
      <p className="text-ink-soft text-sm mb-6">{t("login.subtitle")}</p>

      {state.error && (
        <div className="mb-4 rounded-xl bg-danger-50 border border-danger/30 px-4 py-2.5 text-danger text-sm">
          {state.error}
        </div>
      )}

      <label className="block text-sm font-bold text-ink mb-1.5">
        {t("login.email")}
      </label>
      <div className="relative mb-4">
        <input
          name="email"
          type="email"
          dir="ltr"
          required
          placeholder="example@ienglish.com"
          className="field pr-4 pl-11 text-left"
        />
        <span className="absolute inset-y-0 left-3 grid place-items-center text-ink-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-bold text-ink">{t("password")}</label>
        <a className="text-sm text-brand font-bold" href="/forgot">
          {t("login.forgot")}
        </a>
      </div>
      <div className="relative mb-4">
        <input
          name="password"
          type={showPass ? "text" : "password"}
          required
          placeholder="••••••••"
          className="field ps-11 pe-11"
        />
        <span className="absolute inset-y-0 start-3 grid place-items-center text-ink-soft">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <button
          type="button"
          onClick={() => setShowPass((v) => !v)}
          className="absolute inset-y-0 end-3 grid place-items-center text-ink-soft hover:text-ink"
          aria-label="إظهار كلمة المرور"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <label className="flex items-center justify-end gap-2 mb-6 text-sm text-ink cursor-pointer">
        {t("login.remember")}
        <input name="remember" type="checkbox" className="size-4 accent-brand" />
      </label>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? t("login.submitting") : t("login.submit")}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="my-5 h-px bg-line" />
      <p className="text-center text-sm text-ink-soft">
        {t("login.noAccount")}{" "}
        <a className="text-brand font-bold" href="#">
          {t("login.contact")}
        </a>
      </p>
    </form>
  );
}
