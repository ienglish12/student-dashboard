"use server";

import { redirect } from "next/navigation";
import { login as doLogin, logout as doLogout } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور." };
  }

  const session = await doLogin(email, password, remember);
  if (!session) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  redirect(session.role === "ADMIN" ? "/dashboard" : "/entry");
}

export async function logoutAction() {
  await doLogout();
  redirect("/login");
}
