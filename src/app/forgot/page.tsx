import { ForgotForm } from "./forgot-form";
import { LoginToggles } from "@/app/login/login-chrome";

export default function ForgotPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-brand-50 to-canvas">
      <LoginToggles />
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="size-16 rounded-2xl bg-navy grid place-items-center text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 15v-3M12 15V9M17 15v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-ink">آي إنجلش</h1>
      </div>
      <ForgotForm />
    </div>
  );
}
