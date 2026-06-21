"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const T: Dict = {
  // chrome
  "app.name": { ar: "آي إنجلش", en: "iEnglish" },
  "app.tagline": { ar: "نظام تحليل البيانات", en: "Analytics System" },
  "nav.analysis": { ar: "تحليل البيانات", en: "Analytics" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },
  "role.admin": { ar: "مسؤول", en: "Admin" },
  "role.branch": { ar: "موظف", en: "Staff" },
  logout: { ar: "تسجيل الخروج", en: "Log out" },
  refresh: { ar: "تحديث", en: "Refresh" },
  print: { ar: "طباعة", en: "Print" },
  save: { ar: "حفظ البيانات", en: "Save data" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  add: { ar: "إضافة", en: "Add" },
  password: { ar: "كلمة المرور", en: "Password" },

  // login
  "login.title": { ar: "تسجيل الدخول", en: "Sign in" },
  "login.subtitle": {
    ar: "أدخل بياناتك للوصول إلى لوحة التحكم",
    en: "Enter your credentials to access the dashboard",
  },
  "login.email": { ar: "البريد الإلكتروني", en: "Email" },
  "login.forgot": { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  "login.remember": { ar: "تذكرني على هذا الجهاز", en: "Remember me" },
  "login.submit": { ar: "تسجيل الدخول", en: "Sign in" },
  "login.submitting": { ar: "جارٍ الدخول…", en: "Signing in…" },
  "login.noAccount": { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  "login.contact": { ar: "اتصل بالإدارة", en: "Contact admin" },
  "login.tagline": { ar: "نظام تحليل البيانات الأكاديمي", en: "Academic data analytics" },
  "login.quote": {
    ar: "البيانات هي لغة المستقبل، ونحن هنا لمساعدتك على فهمها بدقة.",
    en: "Data is the language of the future — we help you read it precisely.",
  },

  // entry
  "entry.subtitle": { ar: "إدخال البيانات الشهرية", en: "Monthly data entry" },
  "entry.total": { ar: "إجمالي الطلاب", en: "Total students" },
  "entry.startHint": {
    ar: "ابدأ بإدخال عدد الذكور والإناث — الإجمالي بيتحسب تلقائياً.",
    en: "Start with male & female counts — the total is computed automatically.",
  },
  "entry.allMatch": { ar: "كل البيانات متطابقة ✓", en: "All data matches ✓" },
  "entry.allMatchSub": {
    ar: "كل المجموعات بتساوي إجمالي الطلاب",
    en: "All groups equal the total students",
  },
  "entry.mismatch": {
    ar: "مجموعة غير مطابقة للإجمالي",
    en: "group(s) don't match the total",
  },
  "entry.advisory": {
    ar: "تحذير إرشادي فقط — تقدر تحفظ عادي، بس راجع الأرقام.",
    en: "Advisory only — you can still save, but review the numbers.",
  },
  "entry.over": { ar: "زيادة", en: "over by" },
  "entry.under": { ar: "ناقص", en: "short by" },
  "entry.sum": { ar: "المجموع", en: "sum" },
  "entry.addNationality": { ar: "جنسية أخرى", en: "Other nationality" },
  "entry.addCourse": { ar: "إضافة دورة", en: "Add course" },
  "entry.renewalCount": { ar: "عدد المجدّدين", en: "Renewals" },
  "entry.renewalRate": { ar: "نسبة التجديد", en: "Renewal rate" },
  "entry.notesPlaceholder": {
    ar: "أي ملاحظات عن بيانات الشهر ده… (اختياري)",
    en: "Any notes about this month's data… (optional)",
  },
  "entry.lastSaved": { ar: "آخر حفظ", en: "Last saved" },
  "entry.notSaved": { ar: "لم يتم الحفظ بعد", en: "Not saved yet" },
  "entry.saved": { ar: "✓ تم الحفظ", en: "✓ Saved" },
  "badge.match": { ar: "مطابق", en: "matches" },

  // sections
  "sec.gender": { ar: "الجنس", en: "Gender" },
  "sec.ages": { ar: "الفئات العمرية", en: "Age groups" },
  "sec.nationalities": { ar: "الجنسيات", en: "Nationalities" },
  "sec.classType": { ar: "نوع الفصل", en: "Class type" },
  "sec.courses": { ar: "الدورات التدريبية", en: "Courses" },
  "sec.levels": { ar: "المستويات الدراسية", en: "Levels" },
  "sec.delivery": { ar: "طريقة الحضور", en: "Delivery mode" },
  "sec.renewals": { ar: "التجديدات", en: "Renewals" },
  "sec.notes": { ar: "ملاحظات إضافية", en: "Additional notes" },

  // fields
  "f.male": { ar: "ذكور", en: "Male" },
  "f.female": { ar: "إناث", en: "Female" },
  "f.nationality": { ar: "الجنسية", en: "Nationality" },
  "f.courseName": { ar: "اسم الدورة", en: "Course name" },
  "f.onsite": { ar: "حضوري", en: "Onsite" },
  "f.online": { ar: "أونلاين", en: "Online" },
  "f.home": { ar: "منزلي", en: "Home" },
  "f.groupAdult": { ar: "مجموعة كبار", en: "Adult Group" },
  "f.vipAdult": { ar: "VIP كبار", en: "VIP Adult" },
  "f.vipKid": { ar: "أكاديمية الأطفال", en: "Kids Academy" },
  "f.classOther": { ar: "أخرى", en: "Other" },

  // course types
  "ct.GENERAL_ENGLISH": { ar: "إنجليزي عام", en: "General English" },
  "ct.TEST_PREP": { ar: "تحضير اختبارات", en: "Test Prep" },
  "ct.OTHER": { ar: "أخرى", en: "Other" },

  // dashboard
  "dash.titleAll": { ar: "تحليل شامل", en: "Overview" },
  "dash.single": { ar: "عرض بيانات فرع واحد", en: "Single-branch view" },
  "dash.submitted": { ar: "فروع سلّمت الداتا", en: "branches submitted" },
  "dash.of": { ar: "من", en: "of" },
  "dash.missing": { ar: "ناقص", en: "missing" },
  "dash.allBranches": { ar: "كل الفروع", en: "All branches" },
  "dash.branchNotes": { ar: "ملاحظات الفرع", en: "Branch notes" },
  "kpi.total": { ar: "إجمالي الطلاب", en: "Total students" },
  "kpi.gender": { ar: "توزيع الجنس", en: "Gender split" },
  "kpi.maleFemale": { ar: "ذكور / إناث", en: "Male / Female" },
  "kpi.avgAge": { ar: "متوسط الأعمار", en: "Avg. age" },
  "kpi.renewal": { ar: "نسبة التجديد", en: "Renewal rate" },
  "kpi.topBranch": { ar: "الفرع الأكثر نمواً", en: "Top branch" },
  "card.demographics": { ar: "الديموغرافية (الجنس)", en: "Demographics (gender)" },
  "card.byBranch": { ar: "توزيع الطلاب حسب الفرع", en: "Students by branch" },
  "card.topNats": { ar: "أهم الجنسيات", en: "Top nationalities" },
  "card.ageGroups": { ar: "الفئات العمرية", en: "Age groups" },
  "card.levels": { ar: "توزيع المستويات", en: "Levels distribution" },
  "legend.male": { ar: "ذكور", en: "Male" },
  "legend.female": { ar: "إناث", en: "Female" },
  "ins.title": { ar: "رؤى ذكية", en: "Auto insights" },
  "ins.highest": { ar: "أعلى معدل تسجيل", en: "Highest enrollment" },
  "ins.diverse": { ar: "الأكثر تنوعاً", en: "Most diverse" },
  "ins.retention": { ar: "أفضل استبقاء", en: "Best retention" },
  "ins.leadsWith": { ar: "يتصدر بـ", en: "leads with" },
  "ins.student": { ar: "طالب", en: "students" },
  "ins.has": { ar: "يضم", en: "has" },
  "ins.nationalities": { ar: "جنسية مختلفة", en: "nationalities" },
  "ins.achieves": { ar: "يحقق", en: "achieves" },
  "ins.renewalRate": { ar: "نسبة تجديد", en: "renewal rate" },
  "empty.title": { ar: "لا توجد بيانات لهذا الشهر", en: "No data for this month" },
  "empty.all": {
    ar: "لم يقم أي فرع بإدخال بياناته بعد لهذه الفترة.",
    en: "No branch has entered data for this period yet.",
  },
  "empty.single": {
    ar: "هذا الفرع لم يُدخل بياناته بعد لهذه الفترة.",
    en: "This branch hasn't entered data for this period yet.",
  },
  "empty.remaining": { ar: "الفروع المتبقية", en: "Remaining branches" },

  // settings
  "set.title": { ar: "إعدادات النظام", en: "System settings" },
  "set.subtitle": {
    ar: "إدارة الفروع، استيراد البيانات، والتحكم في قاعدة البيانات العامة.",
    en: "Manage branches, import data, and control the database.",
  },
  "set.branches": { ar: "إدارة الفروع", en: "Branches" },
  "set.newBranch": { ar: "اسم الفرع الجديد", en: "New branch name" },
  "set.addBranch": { ar: "إضافة فرع", en: "Add branch" },
  "set.report": { ar: "تقرير", en: "reports" },
  "set.user": { ar: "مستخدم", en: "users" },
  "set.edit": { ar: "تعديل", en: "Edit" },
  "set.import": { ar: "استيراد ملفات الفروع", en: "Import branch files" },
  "set.chooseFile": { ar: "اضغط لاختيار ملف", en: "Click to choose a file" },
  "set.importFmt": { ar: "الصيغة المدعومة: JSON", en: "Supported format: JSON" },
  "set.danger": { ar: "منطقة الخطر", en: "Danger zone" },
  "set.dangerText": {
    ar: "سيؤدي هذا الإجراء إلى حذف جميع البيانات المخزنة بشكل نهائي، بما في ذلك التقارير الشهرية لكل الفروع. لا يمكن التراجع.",
    en: "This permanently deletes all stored data, including every branch's monthly reports. This cannot be undone.",
  },
  "set.wipe": { ar: "مسح كل البيانات", en: "Wipe all data" },
  "set.users": { ar: "المستخدمون", en: "Users" },
  "set.usersSub": {
    ar: "أنشئ حسابات الدخول: موظف فرع (يضيف بيانات فرعه فقط) أو مسؤول.",
    en: "Create login accounts: branch staff (own branch only) or admin.",
  },
  "set.emailUser": { ar: "الإيميل (اسم المستخدم)", en: "Email (username)" },
  "set.roleBranch": { ar: "موظف فرع", en: "Branch staff" },
  "set.roleAdmin": { ar: "مسؤول", en: "Admin" },
  "set.chooseBranch": { ar: "— اختر الفرع —", en: "— choose branch —" },
  "set.addUser": { ar: "إضافة مستخدم", en: "Add user" },
  "set.adminRole": { ar: "مسؤول النظام", en: "System admin" },
  "set.staffOf": { ar: "موظف فرع", en: "Branch staff" },
  "set.formPresets": { ar: "إعدادات نموذج الإدخال", en: "Entry-form presets" },
  "set.formPresetsSub": {
    ar: "القيم الافتراضية اللي بتظهر جاهزة للموظف في فورم إدخال بيانات الفرع.",
    en: "Defaults shown to staff in the branch data-entry form.",
  },
  "set.defaultNats": { ar: "الجنسيات الافتراضية", en: "Default nationalities" },
  "set.defaultCourses": { ar: "الكورسات الافتراضية", en: "Default courses" },
  "set.addNat": { ar: "أضف جنسية", en: "Add nationality" },
  "set.courseNamePh": { ar: "اسم الكورس", en: "Course name" },
  "set.noDefaults": { ar: "لا توجد قيم افتراضية.", en: "No defaults." },
};

function detectInitial(): Lang {
  if (typeof window === "undefined") return "ar";
  return (localStorage.getItem("lang") as Lang) || "ar";
}

const LangCtx = createContext<{
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: keyof typeof T | string) => string;
}>({ lang: "ar", dir: "rtl", setLang: () => {}, t: (k) => String(k) });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const initial = detectInitial();
    setLangState(initial);
    applyLang(initial);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
    applyLang(l);
  };

  const t = (key: string) => {
    const entry = T[key];
    return entry ? entry[lang] : key;
  };

  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <LangCtx.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </LangCtx.Provider>
  );
}

function applyLang(l: Lang) {
  const html = document.documentElement;
  html.lang = l;
  html.dir = l === "ar" ? "rtl" : "ltr";
}

export const useT = () => useContext(LangCtx);

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="h-9 px-3 rounded-full grid place-items-center text-sm font-bold text-ink-soft hover:bg-canvas hover:text-ink transition"
      aria-label="Switch language"
      title={lang === "ar" ? "English" : "العربية"}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}

export const MONTHS: Record<Lang, string[]> = {
  ar: [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};
