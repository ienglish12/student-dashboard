# آي إنجلش — iEnglish Analytics

نظام تحليل بيانات أكاديمي لـ 7 فروع. كل فرع يُدخل سجلاً شهرياً واحداً (طلاب، جنس،
أعمار، جنسيات، دورات، أنواع فصول، مستويات، طريقة الحضور، تجديدات)، والمسؤول يرى
لوحة تحكم تجميعية مقارنة عبر كل الفروع لشهر مُختار.

## الستاك (Tech stack)

| الطبقة | التقنية |
|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** |
| Database | **SQLite** (تطوير) / **PostgreSQL** (إنتاج) عبر **Prisma 7** |
| Auth | session مخصص — `jose` (JWT) + `bcryptjs`، مع branch-scoping على السيرفر |
| Styling | **Tailwind CSS 4** (RTL عربي) |
| Charts | **Recharts** |

> اختيار **SQLite للتطوير** يضمن تشغيل التطبيق بدون إعداد خادم قاعدة بيانات.
> الدقة في التحليل مصدرها منطق الحسابات (`src/lib/aggregate.ts`) لا محرّك الـ DB.

## التشغيل المحلي

```bash
npm install
cp .env.example .env          # عدّل AUTH_SECRET (openssl rand -hex 32)
npx prisma migrate dev        # ينشئ قاعدة البيانات
npx prisma db seed            # 7 فروع + مستخدمون + بيانات ديسمبر تجريبية
npm run dev
```

### حسابات الدخول التجريبية

| الدور | البريد | كلمة المرور |
|---|---|---|
| مسؤول النظام | `admin@ienglish.com` | `admin123` |
| فرع | `<slug>@ienglish.com` (مثل `sharjah@ienglish.com`) | `branch123` |

البيانات التجريبية مُدخَلة لفترة **2025-12** (افتح الداشبورد على هذا الشهر).

## التحويل إلى PostgreSQL للإنتاج

1. في `prisma/schema.prisma`: غيّر `provider = "postgresql"`.
2. في `.env`: ضع `DATABASE_URL` لـ Postgres.
3. حوّل حقول `role`/`type` (String) إلى enums أصلية (`Role`, `CourseType`).
4. بدّل الـ adapter في `src/lib/prisma.ts` إلى `@prisma/adapter-pg`.
5. `npx prisma migrate dev`.

## البنية

```
src/
  app/
    login/                  # تسجيل الدخول
    (app)/
      entry/                # إدخال السجل الشهري (فرع: فرعه فقط / أدمن: أي فرع)
      dashboard/            # لوحة التحكم التجميعية (أدمن فقط)
      settings/             # إدارة الفروع + استيراد JSON + منطقة الخطر (أدمن فقط)
    actions/                # server actions: auth, reports, branches
  lib/
    auth.ts                 # session + branch scoping
    prisma.ts               # عميل Prisma
    fields.ts               # تعريفات حقول السجل + التسميات
    aggregate.ts            # منطق التجميع (SPEC §5)
    enums.ts                # Role / CourseType
  components/               # sidebar, icons, number-box
prisma/
  schema.prisma            # نموذج البيانات
  seed.ts                  # البيانات الأولية
```

## ملاحظات وظيفية

- سجل واحد لكل (فرع، فترة) — مفروض عبر قيد فريد + upsert.
- المستخدم الفرعي لا يستطيع قراءة/كتابة فرع آخر — مفروض على **السيرفر** لا الواجهة فقط.
- تلميحات التحقق استشارية (تحذّر ولا تمنع الحفظ).
- استيراد JSON يطابق شكل التصدير = upsert بـ (branchId/slug، period).
