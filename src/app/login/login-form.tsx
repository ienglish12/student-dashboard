"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [showPass, setShowPass] = useState(false);

  return (
    <form action={formAction} className="card w-full max-w-md p-8">
      <h2 className="text-2xl font-extrabold text-navy mb-1">تسجيل الدخول</h2>
      <p className="text-ink-soft text-sm mb-6">
        أدخل بياناتك للوصول إلى لوحة التحكم
      </p>

      {state.error && (
        <div className="mb-4 rounded-xl bg-danger-50 border border-danger/30 px-4 py-2.5 text-danger text-sm">
          {state.error}
        </div>
      )}

      <label className="block text-sm font-bold text-ink mb-1.5">
        البريد الإلكتروني
      </label>
      <div className="relative mb-4">
        <input
          name="email"
          type="email"
          dir="ltr"
          required
          placeholder="example@ienglish.com"
          className="field pr-4 pl-11 text-left"
          defaultValue="admin@ienglish.com"
        />
        <span className="absolute inset-y-0 left-3 grid place-items-center text-ink-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-bold text-ink">كلمة المرور</label>
        <a className="text-sm text-brand font-bold" href="#">
          نسيت كلمة المرور؟
        </a>
      </div>
      <div className="relative mb-4">
        <input
          name="password"
          type={showPass ? "text" : "password"}
          required
          placeholder="••••••••"
          className="field pl-4 pr-11"
          defaultValue="admin123"
        />
        <span className="absolute inset-y-0 right-3 grid place-items-center text-ink-soft">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <button
          type="button"
          onClick={() => setShowPass((v) => !v)}
          className="absolute inset-y-0 left-3 grid place-items-center text-ink-soft hover:text-ink"
          aria-label="إظهار كلمة المرور"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <label className="flex items-center justify-end gap-2 mb-6 text-sm text-ink cursor-pointer">
        تذكرني على هذا الجهاز
        <input name="remember" type="checkbox" className="size-4 accent-brand" />
      </label>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "جارٍ الدخول…" : "تسجيل الدخول"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="my-5 h-px bg-line" />
      <p className="text-center text-sm text-ink-soft">
        ليس لديك حساب؟{" "}
        <a className="text-brand font-bold" href="#">
          اتصل بالإدارة
        </a>
      </p>
    </form>
  );
}
