"use server";

import { redirect } from "next/navigation";
import {
  verifyCredentials,
  createSession,
  logout as doLogout,
} from "@/lib/auth";
import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/rate-limit";
import { emailEnabled, sendEmail, codeEmailHtml } from "@/lib/email";
import {
  generateCode,
  hashCode,
  setTwoFAChallenge,
  readTwoFAChallenge,
  clearTwoFAChallenge,
} from "@/lib/otp";

export type LoginState = { error?: string; twofa?: boolean; email?: string };

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

  // Brute-force throttle.
  const rl = checkRateLimit(email);
  if (!rl.allowed) {
    const mins = Math.max(1, Math.ceil(rl.retryAfterMs / 60000));
    return {
      error: `تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى بعد ${mins} دقيقة.`,
    };
  }

  const cred = await verifyCredentials(email, password);
  if (!cred) {
    recordFailure(email);
    return { error: "بيانات الدخول غير صحيحة." };
  }
  recordSuccess(email);

  // Two-factor for admins (only when email delivery is configured).
  if (cred.role === "ADMIN" && emailEnabled()) {
    try {
      const code = generateCode();
      await sendEmail(
        cred.email,
        "رمز تسجيل الدخول — iEnglish",
        codeEmailHtml(code, "login"),
      );
      await setTwoFAChallenge(
        {
          userId: cred.userId,
          role: cred.role,
          branchId: cred.branchId,
          email: cred.email,
          remember,
        },
        code,
      );
      return { twofa: true, email: cred.email };
    } catch {
      // Fail-safe: if the code can't be sent, sign in normally so the
      // admin is never locked out by an email outage.
    }
  }

  await createSession(
    { userId: cred.userId, role: cred.role, branchId: cred.branchId },
    remember,
  );
  redirect(cred.role === "ADMIN" ? "/dashboard" : "/entry");
}

export async function verifyTwoFactorAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").trim();
  const ch = await readTwoFAChallenge();
  if (!ch) {
    return { error: "انتهت صلاحية الرمز. ابدأ تسجيل الدخول من جديد.", twofa: false };
  }
  if (!code || hashCode(code, ch.email) !== ch.codeHash) {
    return { error: "الرمز غير صحيح.", twofa: true, email: ch.email };
  }

  await createSession(
    { userId: ch.userId, role: ch.role, branchId: ch.branchId },
    ch.remember,
  );
  await clearTwoFAChallenge();
  redirect(ch.role === "ADMIN" ? "/dashboard" : "/entry");
}

export async function logoutAction() {
  await doLogout();
  redirect("/login");
}
