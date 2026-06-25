"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const T: Dict = {
  // chrome
  "app.name": { ar: "آي إنجلش", en: "iEnglish" },
  "app.tagline": { ar: "نظام تحليل البيانات", en: "Analytics System" },
  "nav.analysis": { ar: "تحليل البيانات", en: "Analytics" },
  "nav.compare": { ar: "المقارنة", en: "Compare" },
  "nav.trends": { ar: "الاتجاهات", en: "Trends" },
  "trend.title": { ar: "الاتجاهات عبر الزمن", en: "Trends over time" },
  "trend.subtitle": {
    ar: "تطوّر المؤشرات عبر الشهور — لكل الفروع أو فرع محدد.",
    en: "How key metrics evolve across months — all branches or one branch.",
  },
  "trend.noData": { ar: "لا توجد بيانات كافية لعرض الاتجاهات.", en: "Not enough data to show trends yet." },
  "nav.reports": { ar: "المتابعة", en: "Reports" },
  "nav.import": { ar: "رفع الملفات", en: "Upload" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },

  // import page
  "imp.title": { ar: "رفع كشف الطلاب", en: "Upload student roster" },
  "imp.subtitle": {
    ar: "اختر الفرع وارفع ملف CSV — السستم يحلّله ويجمّعه تلقائياً حسب الشهر.",
    en: "Pick a branch and upload a CSV — auto-analyzed and aggregated by month.",
  },
  "imp.branch": { ar: "الفرع", en: "Branch" },
  "imp.choose": { ar: "اضغط لاختيار ملف CSV", en: "Click to choose a CSV file" },
  "imp.pickFirst": { ar: "اختر الفرع أولاً قبل رفع الملف.", en: "Pick a branch first." },
  "imp.noData": { ar: "لم يتم العثور على بيانات صالحة في الملف.", en: "No valid data found in the file." },
  "imp.failed": { ar: "تعذّر استيراد الملف.", en: "Could not import the file." },
  "imp.skipped": { ar: "صف متخطّى", en: "rows skipped" },
  "csv.colsTitle": { ar: "الأعمدة المكتشفة في الملف", en: "Columns detected in the file" },
  "csv.recognized": { ar: "اتعرفت", en: "Recognized" },
  "csv.missing": { ar: "مش موجودة", en: "Not found" },
  "csv.missingCritical": {
    ar: "⚠ عمود أساسي ناقص — الاستيراد مش هينجح من غيره.",
    en: "⚠ A required column is missing — import can't succeed without it.",
  },
  "csv.date": { ar: "التاريخ", en: "Date" },
  "csv.gender": { ar: "الجنس", en: "Gender" },
  "csv.age": { ar: "العمر / الميلاد", en: "Age / DOB" },
  "csv.nat": { ar: "الجنسية", en: "Nationality" },
  "csv.course": { ar: "الدورة", en: "Course" },
  "csv.cls": { ar: "نوع الفصل", en: "Class type" },
  "csv.level": { ar: "المستوى", en: "Level" },
  "csv.delivery": { ar: "طريقة الحضور", en: "Delivery mode" },
  "csv.renewal": { ar: "التجديد", en: "Renewal" },
  "csv.consultant": { ar: "المستشار", en: "Consultant" },
  "csv.instructor": { ar: "المدرّس", en: "Instructor" },
  "csv.pkg": { ar: "الباقة", en: "Package" },
  "imp.howTitle": { ar: "إزاي يشتغل؟", en: "How it works" },
  "imp.how1": {
    ar: "١. الموظفين يكمّلوا كشوفاتهم (صف لكل طالب) في Google Sheets عادي.",
    en: "1. Staff fill their rosters (one row per student) in Google Sheets.",
  },
  "imp.how2": {
    ar: "٢. صدّر الكشف: File → Download → CSV.",
    en: "2. Export: File → Download → CSV.",
  },
  "imp.how3": {
    ar: "٣. اختر الفرع وارفع الملف هنا — تظهر النتائج في تحليل البيانات.",
    en: "3. Pick the branch and upload — results show in Analytics.",
  },

  // compare
  "cmp.title": { ar: "المقارنة", en: "Compare" },
  "cmp.subtitle": {
    ar: "قارن بين فرع وفرع، أو نفس الفرع عبر شهور مختلفة — في نفس الشهر أو شهور مختلفة.",
    en: "Compare branch vs branch, or the same branch across months — same month or different months.",
  },
  "cmp.periodA": { ar: "الجهة (أ)", en: "Side A" },
  "cmp.periodB": { ar: "الجهة (ب)", en: "Side B" },
  "cmp.branch": { ar: "الفرع", en: "Branch" },
  "cmp.month": { ar: "شهر", en: "Month" },
  "cmp.year": { ar: "سنة", en: "Year" },
  "cmp.range": { ar: "مدة", en: "Range" },
  "cmp.from": { ar: "من", en: "From" },
  "cmp.to": { ar: "إلى", en: "To" },
  "cmp.metric": { ar: "المؤشر", en: "Metric" },
  "cmp.diff": { ar: "الفرق", en: "Change" },
  "cmp.noData": { ar: "لا توجد بيانات في الجهتين المختارتين.", en: "No data for the selected sides." },
  "cmp.allBranches": { ar: "كل الفروع", en: "All branches" },
  "cmp.overview": { ar: "نظرة عامة", en: "Overview" },
  "cmp.conclusions": { ar: "الملاحظات والاستنتاجات", en: "Notes & conclusions" },
  "cmp.autoNotes": { ar: "استنتاجات تلقائية", en: "Auto insights" },
  "cmp.yourNotes": { ar: "ملاحظاتك", en: "Your notes" },
  "cmp.notesPlaceholder": {
    ar: "اكتب ملاحظاتك واستنتاجاتك على المقارنة هنا…",
    en: "Write your own notes and conclusions about this comparison…",
  },
  "cmp.print": { ar: "طباعة", en: "Print" },

  // reports tracker
  "rep.title": { ar: "متابعة التقارير", en: "Submission tracker" },
  "rep.subtitle": {
    ar: "كل شهر وأي فرع سلّم تقريره ومين ناقص.",
    en: "Which branches submitted each month, and who's missing.",
  },
  "rep.month": { ar: "الشهر", en: "Month" },
  "rep.submitted": { ar: "سلّم", en: "submitted" },
  "rep.missing": { ar: "ناقص", en: "missing" },
  "rep.noData": { ar: "لا توجد أي تقارير بعد.", en: "No reports yet." },
  "rep.total": { ar: "الإجمالي", en: "Total" },
  "rep.student": { ar: "طالب", en: "students" },
  "rep.view": { ar: "عرض", en: "View" },
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
  "fp.title": { ar: "استعادة كلمة المرور", en: "Reset password" },
  "fp.subtitle": {
    ar: "اكتب بريدك، وهيوصل طلب للمسؤول لإعادة تعيين كلمة المرور.",
    en: "Enter your email; the admin will be notified to reset it.",
  },
  "fp.submit": { ar: "إرسال الطلب", en: "Send request" },
  "fp.sent": {
    ar: "تم إرسال طلبك ✓ — تواصل مع المسؤول لاستلام كلمة المرور الجديدة.",
    en: "Request sent ✓ — contact the admin for your new password.",
  },
  "fp.back": { ar: "العودة لتسجيل الدخول", en: "Back to sign in" },
  "fp.codeSent": {
    ar: "بعتنا كود تأكيد على بريدك. أدخله مع كلمة المرور الجديدة.",
    en: "We sent a verification code to your email. Enter it with your new password.",
  },
  "fp.code": { ar: "كود التأكيد", en: "Verification code" },
  "fp.newPassword": { ar: "كلمة المرور الجديدة", en: "New password" },
  "fp.setPassword": { ar: "تعيين كلمة المرور", en: "Set password" },
  "fp.resetDone": {
    ar: "✓ تم تغيير كلمة المرور. تقدر تسجّل الدخول دلوقتي.",
    en: "✓ Password changed. You can sign in now.",
  },
  "login.2faTitle": { ar: "تأكيد تسجيل الدخول", en: "Verify sign-in" },
  "login.2faSub": {
    ar: "بعتنا كود تأكيد على بريدك المسجّل. أدخله للمتابعة.",
    en: "We sent a verification code to your email. Enter it to continue.",
  },
  "login.2faCode": { ar: "كود التأكيد", en: "Verification code" },
  "login.2faVerify": { ar: "تأكيد ودخول", en: "Verify & sign in" },
  "login.2faBack": { ar: "رجوع", en: "Back" },
  // reset requests (admin)
  "set.resetRequests": { ar: "طلبات استعادة كلمة المرور", en: "Password reset requests" },
  "set.noRequests": { ar: "لا توجد طلبات.", en: "No requests." },
  "set.setPassword": { ar: "كلمة مرور جديدة", en: "New password" },
  "set.apply": { ar: "تعيين", en: "Set" },
  "set.dismiss": { ar: "تجاهل", en: "Dismiss" },
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
  "entry.manual": { ar: "الإدخال اليدوي", en: "Manual entry" },
  "entry.manualHint": {
    ar: "تفضّل إدخال البيانات يدوياً بدل رفع ملف؟",
    en: "Prefer to enter the data manually instead of uploading a file?",
  },
  "entry.manualOpen": { ar: "فتح نموذج الإدخال اليدوي", en: "Open the manual entry form" },
  "entry.backToUpload": { ar: "الرجوع لرفع الملف", en: "Back to upload" },
  "entry.total": { ar: "إجمالي الطلاب", en: "Total students" },
  "entry.startHint": {
    ar: "ابدأ بإدخال عدد الذكور والإناث — الإجمالي بيتحسب تلقائياً.",
    en: "Start with male & female counts — the total is computed automatically.",
  },
  "entry.reviewHint": {
    ar: "أدخل البيانات على راحتك — هنراجع التطابق مع الإجمالي بعد ما تدوس حفظ.",
    en: "Enter the data freely — we'll check totals after you press Save.",
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
  "dash.exportExcel": { ar: "تصدير Excel", en: "Export Excel" },
  "dash.exportPdf": { ar: "طباعة / حفظ PDF", en: "Print / Save PDF" },
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
  "dash.consultants": { ar: "أداء المستشارين", en: "Consultant performance" },
  "dash.instructors": { ar: "أداء المدرّسين", en: "Instructor performance" },
  "dash.packages": { ar: "نوع الباقة", en: "Package type" },
  "dash.byDay": { ar: "التسجيلات حسب اليوم", en: "Enrollments by day" },
  "dash.renewalsByBranch": { ar: "معدّل التجديد حسب الفرع", en: "Renewal rate by branch" },
  "pkg.hours": { ar: "ساعات", en: "Hours" },
  "pkg.levels": { ar: "مستويات", en: "Levels" },
  "pkg.both": { ar: "ساعات + مستويات", en: "Hours + Levels" },
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
  "set.account": { ar: "حسابي", en: "My account" },
  "set.accountSub": {
    ar: "عدّل بريدك الإلكتروني أو كلمة المرور. لازم تأكيد كلمة المرور الحالية لأي تغيير.",
    en: "Update your email or password. Your current password is required for any change.",
  },
  "set.email": { ar: "البريد الإلكتروني", en: "Email" },
  "set.currentPassword": { ar: "كلمة المرور الحالية", en: "Current password" },
  "set.newPassword": { ar: "كلمة مرور جديدة (اختياري)", en: "New password (optional)" },
  "set.saveAccount": { ar: "حفظ تغييرات الحساب", en: "Save account changes" },
  "set.accountSaved": { ar: "✓ تم حفظ التغييرات", en: "✓ Changes saved" },
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
  "set.import": { ar: "استيراد كشف الطلاب", en: "Import student roster" },
  "set.importHint": {
    ar: "اختر الفرع وارفع ملف CSV (كشف الطلاب) — السستم يحلّله ويجمّعه تلقائياً حسب الشهر.",
    en: "Pick a branch and upload the student CSV — it's auto-aggregated by month.",
  },
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
