"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconStore,
  IconUpload,
  IconWarning,
  IconPlus,
  IconPin,
  IconTrash,
  IconCheck,
} from "@/components/icons";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  importReports,
  wipeAllData,
  addNationalityPreset,
  removeNationalityPreset,
  addCoursePreset,
  removeCoursePreset,
} from "@/app/actions/branches";
import {
  createUser,
  deleteUser,
  resetUserPassword,
} from "@/app/actions/users";
import { COURSE_TYPES, COURSE_TYPE_LABELS, type CourseType } from "@/lib/enums";
import { IconGlobe, IconBook, IconUsers } from "@/components/icons";

type Branch = {
  id: string;
  name: string;
  slug: string;
  reports: number;
  users: number;
};

type NatPreset = { id: string; name: string };
type CoursePreset = { id: string; name: string; type: string };
type UserRow = {
  id: string;
  email: string;
  role: string;
  branchName: string | null;
};

export function SettingsClient({
  currentUserId,
  branches,
  users,
  natPresets,
  coursePresets,
}: {
  currentUserId: string;
  branches: Branch[];
  users: UserRow[];
  natPresets: NatPreset[];
  coursePresets: CoursePreset[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newNat, setNewNat] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newCourseType, setNewCourseType] = useState<string>("GENERAL_ENGLISH");

  const refresh = () => router.refresh();

  function addNat() {
    if (!newNat.trim()) return;
    const name = newNat;
    start(async () => {
      await addNationalityPreset(name);
      setNewNat("");
      refresh();
    });
  }
  function delNat(id: string) {
    start(async () => {
      await removeNationalityPreset(id);
      refresh();
    });
  }
  function addCourse() {
    if (!newCourse.trim()) return;
    const name = newCourse;
    const type = newCourseType;
    start(async () => {
      await addCoursePreset(name, type);
      setNewCourse("");
      refresh();
    });
  }
  function delCourse(id: string) {
    start(async () => {
      await removeCoursePreset(id);
      refresh();
    });
  }

  // ---- User management ----
  const [uEmail, setUEmail] = useState("");
  const [uPass, setUPass] = useState("");
  const [uRole, setURole] = useState("BRANCH");
  const [uBranch, setUBranch] = useState("");
  const [uMsg, setUMsg] = useState<string | null>(null);

  function addUser() {
    setUMsg(null);
    start(async () => {
      try {
        await createUser({
          email: uEmail,
          password: uPass,
          role: uRole,
          branchId: uRole === "BRANCH" ? uBranch || branches[0]?.id : null,
        });
        setUEmail("");
        setUPass("");
        setUMsg("تم إنشاء المستخدم ✓");
        refresh();
      } catch (e) {
        setUMsg(e instanceof Error ? e.message : "حصل خطأ");
      }
    });
  }
  function delUser(id: string) {
    if (!confirm("حذف هذا المستخدم؟")) return;
    start(async () => {
      try {
        await deleteUser(id);
        refresh();
      } catch (e) {
        setUMsg(e instanceof Error ? e.message : "حصل خطأ");
      }
    });
  }
  function resetPass(id: string) {
    const p = prompt("كلمة المرور الجديدة (6 أحرف على الأقل):");
    if (!p) return;
    start(async () => {
      try {
        await resetUserPassword(id, p);
        setUMsg("تم تغيير كلمة المرور ✓");
      } catch (e) {
        setUMsg(e instanceof Error ? e.message : "حصل خطأ");
      }
    });
  }

  function add() {
    if (!newName.trim()) return;
    start(async () => {
      await createBranch(newName);
      setNewName("");
      refresh();
    });
  }

  function saveEdit() {
    if (!editId) return;
    const id = editId;
    const name = editName;
    start(async () => {
      await updateBranch(id, name);
      setEditId(null);
      refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("حذف هذا الفرع وكل تقاريره؟ لا يمكن التراجع.")) return;
    start(async () => {
      await deleteBranch(id);
      refresh();
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const items = Array.isArray(json) ? json : [json];
      start(async () => {
        const res = await importReports(items);
        setImportMsg(
          `تم استيراد ${res.imported} سجل` +
            (res.errors.length ? ` (${res.errors.length} تخطٍّ)` : ""),
        );
        refresh();
      });
    } catch {
      setImportMsg("تعذّر قراءة الملف. تأكد أنه JSON صالح.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function wipe() {
    const phrase = prompt(
      'سيؤدي هذا إلى حذف جميع البيانات نهائياً. اكتب "حذف" للتأكيد:',
    );
    if (phrase !== "حذف") return;
    start(async () => {
      await wipeAllData();
      refresh();
    });
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1400px]">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">إعدادات النظام</h1>
          <p className="text-ink-soft mt-1">
            إدارة الفروع، استيراد البيانات، والتحكم في قاعدة البيانات العامة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch management */}
          <section className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <IconStore className="text-brand" />
                <h2 className="font-extrabold text-ink">إدارة الفروع</h2>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم الفرع الجديد"
                className="field flex-1"
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <button onClick={add} disabled={pending} className="btn-primary">
                <IconPlus width={16} height={16} /> إضافة فرع
              </button>
            </div>

            <div className="space-y-3">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-line p-3"
                >
                  <span className="size-10 rounded-full bg-brand-50 grid place-items-center text-brand shrink-0">
                    <IconPin />
                  </span>
                  {editId === b.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="field flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink truncate">{b.name}</p>
                      <p className="text-xs text-ink-soft">
                        {b.reports} تقرير · {b.users} مستخدم
                      </p>
                    </div>
                  )}

                  {editId === b.id ? (
                    <button onClick={saveEdit} className="text-success p-2 hover:bg-success/10 rounded-lg">
                      <IconCheck />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditId(b.id);
                        setEditName(b.name);
                      }}
                      className="text-ink-soft text-sm font-bold px-3 hover:text-brand"
                    >
                      تعديل
                    </button>
                  )}
                  <button
                    onClick={() => remove(b.id)}
                    className="text-danger p-2 hover:bg-danger-50 rounded-lg"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Import + danger zone */}
          <div className="space-y-6">
            <section className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconUpload className="text-brand" />
                <h2 className="font-extrabold text-ink">استيراد ملفات الفروع</h2>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="w-full rounded-xl border-2 border-dashed border-line p-6 text-center hover:border-brand transition"
              >
                <IconUpload className="mx-auto text-brand mb-2" width={28} height={28} />
                <p className="font-bold text-ink">اضغط لاختيار ملف</p>
                <p className="text-xs text-ink-soft mt-1">الصيغة المدعومة: JSON</p>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={onFile}
                className="hidden"
              />
              {importMsg && (
                <p className="text-sm text-ink mt-3 bg-canvas rounded-lg p-2.5">
                  {importMsg}
                </p>
              )}
            </section>

            <section className="card p-6 border-danger/30 bg-danger-50">
              <div className="flex items-center gap-2 mb-3">
                <IconWarning className="text-danger" />
                <h2 className="font-extrabold text-danger">منطقة الخطر</h2>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                سيؤدي هذا الإجراء إلى حذف جميع البيانات المخزنة بشكل نهائي، بما في
                ذلك التقارير الشهرية لكل الفروع. لا يمكن التراجع عن هذا الإجراء.
              </p>
              <button
                onClick={wipe}
                disabled={pending}
                className="w-full rounded-full bg-danger px-5 py-2.5 font-bold text-white hover:bg-red-600 transition"
              >
                مسح كل البيانات
              </button>
            </section>
          </div>
        </div>

        {/* User management */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <IconUsers className="text-brand" />
            <h2 className="font-extrabold text-ink">المستخدمون</h2>
          </div>
          <p className="text-sm text-ink-soft mb-5">
            أنشئ حسابات الدخول: موظف فرع (يضيف بيانات فرعه فقط) أو مسؤول.
          </p>

          {/* Add user form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
            <input
              value={uEmail}
              onChange={(e) => setUEmail(e.target.value)}
              placeholder="الإيميل (اسم المستخدم)"
              dir="ltr"
              className="field text-left lg:col-span-2"
            />
            <input
              value={uPass}
              onChange={(e) => setUPass(e.target.value)}
              placeholder="كلمة المرور"
              type="text"
              dir="ltr"
              className="field text-left"
            />
            <select
              value={uRole}
              onChange={(e) => setURole(e.target.value)}
              className="field"
            >
              <option value="BRANCH">موظف فرع</option>
              <option value="ADMIN">مسؤول</option>
            </select>
            {uRole === "BRANCH" ? (
              <select
                value={uBranch}
                onChange={(e) => setUBranch(e.target.value)}
                className="field"
              >
                <option value="">— اختر الفرع —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="hidden lg:block" />
            )}
          </div>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={addUser} disabled={pending} className="btn-primary">
              <IconPlus width={16} height={16} /> إضافة مستخدم
            </button>
            {uMsg && <span className="text-sm text-ink-soft">{uMsg}</span>}
          </div>

          {/* Users list */}
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-line p-3"
              >
                <span
                  className={`size-9 rounded-full grid place-items-center font-bold text-white shrink-0 ${
                    u.role === "ADMIN" ? "bg-navy" : "bg-brand"
                  }`}
                >
                  {u.email[0]?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink truncate" dir="ltr">
                    {u.email}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {u.role === "ADMIN"
                      ? "مسؤول النظام"
                      : `موظف فرع${u.branchName ? " · " + u.branchName : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => resetPass(u.id)}
                  className="text-ink-soft text-sm font-bold px-3 hover:text-brand"
                >
                  كلمة المرور
                </button>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => delUser(u.id)}
                    className="text-danger p-2 hover:bg-danger-50 rounded-lg"
                    aria-label="حذف"
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Entry-form presets (admin controls what the branch form shows) */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <IconBook className="text-brand" />
            <h2 className="font-extrabold text-ink">إعدادات نموذج الإدخال</h2>
          </div>
          <p className="text-sm text-ink-soft mb-5">
            القيم الافتراضية اللي بتظهر جاهزة للموظف في فورم إدخال بيانات الفرع.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Default nationalities */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconGlobe className="text-brand" width={18} height={18} />
                <h3 className="font-bold text-ink">الجنسيات الافتراضية</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={newNat}
                  onChange={(e) => setNewNat(e.target.value)}
                  placeholder="أضف جنسية"
                  className="field flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addNat()}
                />
                <button onClick={addNat} disabled={pending} className="btn-primary px-4">
                  <IconPlus width={16} height={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {natPresets.length === 0 && (
                  <p className="text-ink-soft text-sm">لا توجد قيم افتراضية.</p>
                )}
                {natPresets.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-canvas border border-line px-3 py-1.5 text-sm"
                  >
                    {p.name}
                    <button
                      onClick={() => delNat(p.id)}
                      className="text-ink-soft hover:text-danger"
                      aria-label="حذف"
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Default courses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconBook className="text-brand" width={18} height={18} />
                <h3 className="font-bold text-ink">الكورسات الافتراضية</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="اسم الكورس"
                  className="field flex-1 min-w-0"
                  onKeyDown={(e) => e.key === "Enter" && addCourse()}
                />
                <select
                  value={newCourseType}
                  onChange={(e) => setNewCourseType(e.target.value)}
                  className="field w-32 shrink-0"
                >
                  {COURSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {COURSE_TYPE_LABELS[t as CourseType]}
                    </option>
                  ))}
                </select>
                <button onClick={addCourse} disabled={pending} className="btn-primary px-4">
                  <IconPlus width={16} height={16} />
                </button>
              </div>
              <div className="space-y-2">
                {coursePresets.length === 0 && (
                  <p className="text-ink-soft text-sm">لا توجد قيم افتراضية.</p>
                )}
                {coursePresets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-canvas border border-line px-3 py-2"
                  >
                    <div>
                      <span className="font-bold text-ink text-sm">{p.name}</span>
                      <span className="text-xs text-ink-soft mr-2">
                        {COURSE_TYPE_LABELS[p.type as CourseType] ?? p.type}
                      </span>
                    </div>
                    <button
                      onClick={() => delCourse(p.id)}
                      className="text-ink-soft hover:text-danger"
                      aria-label="حذف"
                    >
                      <IconTrash width={16} height={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
