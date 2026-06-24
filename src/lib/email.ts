import "server-only";

// Email delivery via Resend's REST API (no SDK dependency needed).
// Falls back to "disabled" when no API key is configured, so callers can
// degrade gracefully instead of breaking the flow.

const DEFAULT_FROM = "iEnglish <onboarding@resend.dev>";

export function emailEnabled() {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("email-not-configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`email-failed-${res.status}`);
  }
}

export function codeEmailHtml(code: string, purpose: "reset" | "login") {
  const title =
    purpose === "reset" ? "إعادة تعيين كلمة المرور" : "رمز تسجيل الدخول";
  return `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:480px;margin:auto;padding:8px">
    <h2 style="color:#1d4ed8;margin:0 0 12px">iEnglish — ${title}</h2>
    <p style="margin:0 0 8px">رمز التأكيد الخاص بك هو:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#16243f;margin:8px 0">${code}</p>
    <p style="color:#64748b;font-size:13px;margin:12px 0 0">الرمز صالح لمدة قصيرة. لو مش إنت اللي طلبت ده، تجاهل الرسالة.</p>
  </div>`;
}
