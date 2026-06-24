import { ForgotForm } from "./forgot-form";
import { LoginToggles } from "@/app/login/login-chrome";
import { BrandLogo } from "@/components/brand-logo";

export default function ForgotPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-brand-50 to-canvas">
      <LoginToggles />
      <div className="flex flex-col items-center gap-3 mb-8">
        <BrandLogo size="login" />
      </div>
      <ForgotForm />
    </div>
  );
}
