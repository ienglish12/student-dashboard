"use server";

import { redirect } from "next/navigation";
import { login as doLogin, logout as doLogout } from "@/lib/auth";
import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور." };
  }

  // Brute-force throttle: block after too many failed attempts.
  const rl = checkRateLimit(email);
  if (!rl.allowed) {
    const mins = Math.max(1, Math.ceil(rl.retryAfterMs / 60000));
    return {
      error: `تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى بعد ${mins} دقيقة.`,
    };
  }

  const session = await doLogin(email, password, remember);
  if (!session) {
    recordFailure(email);
    return { error: "بيانات الدخول غير صحيحة." };
  }

  recordSuccess(email);
  redirect(session.role === "ADMIN" ? "/dashboard" : "/entry");
}

export async function logoutAction() {
  await doLogout();
  redirect("/login");
}
