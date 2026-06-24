import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LoginToggles, LoginTagline, LoginQuote } from "./login-chrome";
import { BrandLogo } from "@/components/brand-logo";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/dashboard" : "/entry");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-brand-50 to-canvas">
      <LoginToggles />
      {/* Logo + brand */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <BrandLogo size="login" />
        <LoginTagline />
      </div>

      <LoginForm />
      <LoginQuote />
    </div>
  );
}
