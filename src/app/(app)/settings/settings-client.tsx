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
  importStudentSheet,
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
import { COURSE_TYPES } from "@/lib/enums";
import { IconGlobe, IconBook, IconUsers } from "@/components/icons";
import { useT } from "@/components/i18n";

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
  const { t } = useT();
  const [pending, start] = useTransition();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [impBranch, setImpBranch] = useState("");
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
    if (!impBranch) {
      setImportMsg("اختر الفرع أولاً قبل رفع الملف.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    try {
      const text = await file.text();
      start(async () => {
        try {
          const res = await importStudentSheet(impBranch, text);
          if (!res.ok) {
            setImportMsg("لم يتم العثور على بيانات صالحة في الملف.");
          } else {
            setImportMsg(
              `✓ تم تحليل ${res.totalStudents} طالب وحفظها لشهور: ${res.periods.join("، ")}` +
                (res.skipped ? ` (تم تخطّي ${res.skipped} صف بدون بيانات)` : ""),
            );
          }
          refresh();
        } catch (err) {
          setImportMsg(err instanceof Error ? err.message : "تعذّر استيراد الملف.");
        }
      });
    } catch {
      setImportMsg("تعذّر قراءة الملف.");
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
          <h1 className="text-3xl font-extrabold text-ink">{t("set.title")}</h1>
          <p className="text-ink-soft mt-1">{t("set.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch management */}
          <section className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <IconStore className="text-brand" />
                <h2 className="font-extrabold text-ink">{t("set.branches")}</h2>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("set.newBranch")}
                className="field flex-1"
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <button onClick={add} disabled={pending} className="btn-primary">
                <IconPlus width={16} height={16} /> {t("set.addBranch")}
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
                        {b.reports} {t("set.report")} · {b.users} {t("set.user")}
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
                      {t("set.edit")}
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
                <h2 className="font-extrabold text-ink">{t("set.import")}</h2>
              </div>
              <p className="text-xs text-ink-soft mb-3">{t("set.importHint")}</p>
              <select
                value={impBranch}
                onChange={(e) => setImpBranch(e.target.value)}
                className="field w-full mb-3"
              >
                <option value="">{t("set.chooseBranch")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={pending || !impBranch}
                className="w-full rounded-xl border-2 border-dashed border-line p-6 text-center hover:border-brand transition disabled:opacity-50"
              >
                <IconUpload className="mx-auto text-brand mb-2" width={28} height={28} />
                <p className="font-bold text-ink">{t("set.chooseFile")}</p>
                <p className="text-xs text-ink-soft mt-1">CSV</p>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
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
                <h2 className="font-extrabold text-danger">{t("set.danger")}</h2>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                {t("set.dangerText")}
              </p>
              <button
                onClick={wipe}
                disabled={pending}
                className="w-full rounded-full bg-danger px-5 py-2.5 font-bold text-white hover:bg-red-600 transition"
              >
                {t("set.wipe")}
              </button>
            </section>
          </div>
        </div>

        {/* User management */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <IconUsers className="text-brand" />
            <h2 className="font-extrabold text-ink">{t("set.users")}</h2>
          </div>
          <p className="text-sm text-ink-soft mb-5">{t("set.usersSub")}</p>

          {/* Add user form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
            <input
              value={uEmail}
              onChange={(e) => setUEmail(e.target.value)}
              placeholder={t("set.emailUser")}
              dir="ltr"
              className="field text-left lg:col-span-2"
            />
            <input
              value={uPass}
              onChange={(e) => setUPass(e.target.value)}
              placeholder={t("password")}
              type="text"
              dir="ltr"
              className="field text-left"
            />
            <select
              value={uRole}
              onChange={(e) => setURole(e.target.value)}
              className="field"
            >
              <option value="BRANCH">{t("set.roleBranch")}</option>
              <option value="ADMIN">{t("set.roleAdmin")}</option>
            </select>
            {uRole === "BRANCH" ? (
              <select
                value={uBranch}
                onChange={(e) => setUBranch(e.target.value)}
                className="field"
              >
                <option value="">{t("set.chooseBranch")}</option>
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
              <IconPlus width={16} height={16} /> {t("set.addUser")}
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
                      ? t("set.adminRole")
                      : `${t("set.staffOf")}${u.branchName ? " · " + u.branchName : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => resetPass(u.id)}
                  className="text-ink-soft text-sm font-bold px-3 hover:text-brand"
                >
                  {t("password")}
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
            <h2 className="font-extrabold text-ink">{t("set.formPresets")}</h2>
          </div>
          <p className="text-sm text-ink-soft mb-5">{t("set.formPresetsSub")}</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Default nationalities */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconGlobe className="text-brand" width={18} height={18} />
                <h3 className="font-bold text-ink">{t("set.defaultNats")}</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={newNat}
                  onChange={(e) => setNewNat(e.target.value)}
                  placeholder={t("set.addNat")}
                  className="field flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addNat()}
                />
                <button onClick={addNat} disabled={pending} className="btn-primary px-4">
                  <IconPlus width={16} height={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {natPresets.length === 0 && (
                  <p className="text-ink-soft text-sm">{t("set.noDefaults")}</p>
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
                <h3 className="font-bold text-ink">{t("set.defaultCourses")}</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder={t("set.courseNamePh")}
                  className="field flex-1 min-w-0"
                  onKeyDown={(e) => e.key === "Enter" && addCourse()}
                />
                <select
                  value={newCourseType}
                  onChange={(e) => setNewCourseType(e.target.value)}
                  className="field w-32 shrink-0"
                >
                  {COURSE_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {t(`ct.${ct}`)}
                    </option>
                  ))}
                </select>
                <button onClick={addCourse} disabled={pending} className="btn-primary px-4">
                  <IconPlus width={16} height={16} />
                </button>
              </div>
              <div className="space-y-2">
                {coursePresets.length === 0 && (
                  <p className="text-ink-soft text-sm">{t("set.noDefaults")}</p>
                )}
                {coursePresets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-canvas border border-line px-3 py-2"
                  >
                    <div>
                      <span className="font-bold text-ink text-sm">{p.name}</span>
                      <span className="text-xs text-ink-soft mr-2">
                        {t(`ct.${p.type}`)}
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
