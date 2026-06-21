import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "آي إنجلش — نظام تحليل البيانات",
  description: "iEnglish Analytics — نظام تحليل البيانات الأكاديمي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;if(localStorage.theme==='dark')d.classList.add('dark');var l=localStorage.lang;if(l){d.lang=l;d.dir=l==='ar'?'rtl':'ltr';}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full antialiased font-sans bg-canvas text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
