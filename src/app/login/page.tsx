import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/dashboard" : "/entry");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-brand-50 to-canvas">
      {/* Logo + brand */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="size-16 rounded-2xl bg-navy grid place-items-center text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 15v-3M12 15V9M17 15v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-navy">آي إنجلش</h1>
        <p className="text-ink-soft text-sm">نظام تحليل البيانات الأكاديمي</p>
      </div>

      <LoginForm />

      <p className="mt-8 text-sm text-ink-soft italic text-center max-w-md">
        &quot;البيانات هي لغة المستقبل، ونحن هنا لمساعدتك على فهمها بدقة.&quot;
      </p>
    </div>
  );
}
