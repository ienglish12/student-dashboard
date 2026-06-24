"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconStore,
  IconWarning,
  IconPlus,
  IconPin,
  IconTrash,
  IconCheck,
  IconUsers,
} from "@/components/icons";
import { createBranch, updateBranch, deleteBranch, wipeAllData } from "@/app/actions/branches";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  resolveResetRequest,
  dismissResetRequest,
  updateMyAccount,
} from "@/app/actions/users";
import { useT } from "@/components/i18n";

type Branch = { id: string; name: string; slug: string; reports: number; users: number };
type UserRow = { id: string; email: string; role: string; branchName: string | null };
type ResetReq = { id: string; email: string; createdAt: string };

export function SettingsClient({
  currentUserId,
  currentEmail,
  branches,
  users,
  resetRequests,
}: {
  currentUserId: string;
  currentEmail: string;
  branches: Branch[];
  users: UserRow[];
  resetRequests: ResetReq[];
}) {
  const router = useRouter();
  const { t } = useT();
  const [pending, start] = useTransition();
  const refresh = () => router.refresh();

  // my account
  const [accEmail, setAccEmail] = useState(currentEmail);
  const [accCurrent, setAccCurrent] = useState("");
  const [accNew, setAccNew] = useState("");
  const [accMsg, setAccMsg] = useState<string | null>(null);
  const [accOk, setAccOk] = useState(false);

  function saveAccount() {
    setAccMsg(null);
    setAccOk(false);
    start(async () => {
      try {
        await updateMyAccount({
          email: accEmail,
          currentPassword: accCurrent,
          newPassword: accNew || undefined,
        });
        setAccCurrent("");
        setAccNew("");
        setAccOk(true);
        setAccMsg(t("set.accountSaved"));
        refresh();
      } catch (e) {
        setAccMsg(e instanceof Error ? e.message : "حصل خطأ");
      }
    });
  }

  // branches
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function addBranch() {
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
  function removeBranch(id: string) {
    if (!confirm("حذف هذا الفرع وكل تقاريره؟ لا يمكن التراجع.")) return;
    start(async () => {
      await deleteBranch(id);
      refresh();
    });
  }

  // users
  const [uEmail, setUEmail] = useState("");
  const [uPass, setUPass] = useState("");
  const [uBranch, setUBranch] = useState("");
  const [uMsg, setUMsg] = useState<string | null>(null);

  function addUser() {
    setUMsg(null);
    start(async () => {
      try {
        await createUser({
          email: uEmail,
          password: uPass,
          role: "BRANCH",
          branchId: uBranch || branches[0]?.id,
        });
        setUEmail("");
        setUPass("");
        setUMsg("✓");
        refresh();
      } catch (e) {
        setUMsg(e instanceof Error ? e.message : "حصل خطأ");
      }
    });
  }
  function delUser(id: string) {
    if (!confirm("حذف هذا المستخدم؟")) return;
    start(async () => {
      await deleteUser(id);
      refresh();
    });
  }
  function resetPass(id: string) {
    const p = prompt("كلمة المرور الجديدة (8 أحرف على الأقل، حروف وأرقام):");
    if (!p) return;
    start(async () => {
      await resetUserPassword(id, p);
      refresh();
    });
  }

  // reset requests
  function fulfill(req: ResetReq) {
    const p = prompt(`كلمة مرور جديدة لـ ${req.email} (8 أحرف على الأقل، حروف وأرقام):`);
    if (!p) return;
    start(async () => {
      await resolveResetRequest(req.id, p);
      refresh();
    });
  }
  function dismiss(id: string) {
    start(async () => {
      await dismissResetRequest(id);
      refresh();
    });
  }

  function wipe() {
    const phrase = prompt('سيؤدي هذا إلى حذف جميع البيانات نهائياً. اكتب "حذف" للتأكيد:');
    if (phrase !== "حذف") return;
    start(async () => {
      await wipeAllData();
      refresh();
    });
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1100px]">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{t("set.title")}</h1>
          <p className="text-ink-soft mt-1">{t("set.subtitle")}</p>
        </div>

        {/* My account — email + password */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <IconUsers className="text-brand" />
            <h2 className="font-extrabold text-ink">{t("set.account")}</h2>
          </div>
          <p className="text-sm text-ink-soft mb-4">{t("set.accountSub")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-ink mb-1.5">{t("set.email")}</label>
              <input
                value={accEmail}
                onChange={(e) => setAccEmail(e.target.value)}
                dir="ltr"
                type="email"
                className="field text-left w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">{t("set.currentPassword")}</label>
              <input
                value={accCurrent}
                onChange={(e) => setAccCurrent(e.target.value)}
                dir="ltr"
                type="password"
                autoComplete="current-password"
                className="field text-left w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">{t("set.newPassword")}</label>
              <input
                value={accNew}
                onChange={(e) => setAccNew(e.target.value)}
                dir="ltr"
                type="password"
                autoComplete="new-password"
                className="field text-left w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={saveAccount} disabled={pending || !accCurrent} className="btn-primary">
              <IconCheck width={16} height={16} /> {t("set.saveAccount")}
            </button>
            {accMsg && (
              <span className={`text-sm font-bold ${accOk ? "text-success" : "text-danger"}`}>
                {accMsg}
              </span>
            )}
          </div>
        </section>

        {/* Password reset requests (only when present) */}
        {resetRequests.length > 0 && (
          <section className="card p-6 border-warning/30">
            <div className="flex items-center gap-2 mb-4">
              <IconWarning className="text-warning" />
              <h2 className="font-extrabold text-ink">
                {t("set.resetRequests")} ({resetRequests.length})
              </h2>
            </div>
            <div className="space-y-2">
              {resetRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate" dir="ltr">{r.email}</p>
                    <p className="text-xs text-ink-soft">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => fulfill(r)} disabled={pending} className="btn-primary py-1.5 px-3 text-sm">
                    {t("set.apply")}
                  </button>
                  <button onClick={() => dismiss(r.id)} className="text-ink-soft text-sm font-bold px-2 hover:text-danger">
                    {t("set.dismiss")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-6">
          {/* Branches */}
          <section className="card p-6 order-2">
            <div className="flex items-center gap-2 mb-5">
              <IconStore className="text-brand" />
              <h2 className="font-extrabold text-ink">{t("set.branches")}</h2>
            </div>
            <div className="flex gap-2 mb-5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("set.newBranch")}
                className="field flex-1"
                onKeyDown={(e) => e.key === "Enter" && addBranch()}
              />
              <button onClick={addBranch} disabled={pending} className="btn-primary">
                <IconPlus width={16} height={16} /> {t("set.addBranch")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
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
                  <button onClick={() => removeBranch(b.id)} className="text-danger p-2 hover:bg-danger-50 rounded-lg">
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Users */}
          <section className="card p-6 order-1">
            <div className="flex items-center gap-2 mb-1">
              <IconUsers className="text-brand" />
              <h2 className="font-extrabold text-ink">{t("set.users")}</h2>
            </div>
            <p className="text-sm text-ink-soft mb-4">{t("set.usersSub")}</p>
            <div className="space-y-2 mb-3">
              <input
                value={uEmail}
                onChange={(e) => setUEmail(e.target.value)}
                placeholder={t("set.emailUser")}
                dir="ltr"
                className="field text-left w-full"
              />
              <input
                value={uPass}
                onChange={(e) => setUPass(e.target.value)}
                placeholder={t("password")}
                dir="ltr"
                className="field text-left w-full"
              />
              <select value={uBranch} onChange={(e) => setUBranch(e.target.value)} className="field w-full">
                <option value="">{t("set.chooseBranch")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={addUser} disabled={pending} className="btn-primary">
                <IconPlus width={16} height={16} /> {t("set.addUser")}
              </button>
              {uMsg && <span className="text-sm text-ink-soft">{uMsg}</span>}
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span
                    className={`size-9 rounded-full grid place-items-center font-bold text-white shrink-0 ${
                      u.role === "ADMIN" ? "bg-navy" : "bg-brand"
                    }`}
                  >
                    {u.email[0]?.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate" dir="ltr">{u.email}</p>
                    <p className="text-xs text-ink-soft">
                      {u.role === "ADMIN"
                        ? t("set.adminRole")
                        : `${t("set.staffOf")}${u.branchName ? " · " + u.branchName : ""}`}
                    </p>
                  </div>
                  <button onClick={() => resetPass(u.id)} className="text-ink-soft text-sm font-bold px-2 hover:text-brand">
                    {t("password")}
                  </button>
                  {u.id !== currentUserId && (
                    <button onClick={() => delUser(u.id)} className="text-danger p-2 hover:bg-danger-50 rounded-lg">
                      <IconTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Danger zone */}
        <section className="card p-6 border-danger/30 bg-danger-50">
          <div className="flex items-center gap-2 mb-3">
            <IconWarning className="text-danger" />
            <h2 className="font-extrabold text-danger">{t("set.danger")}</h2>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed mb-4">{t("set.dangerText")}</p>
          <button
            onClick={wipe}
            disabled={pending}
            className="rounded-full bg-danger px-6 py-2.5 font-bold text-white hover:bg-red-600 transition"
          >
            {t("set.wipe")}
          </button>
        </section>
      </div>
    </div>
  );
}
