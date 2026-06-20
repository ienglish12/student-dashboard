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
} from "@/app/actions/branches";

type Branch = {
  id: string;
  name: string;
  slug: string;
  reports: number;
  users: number;
};

export function SettingsClient({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => router.refresh();

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
      <header className="flex items-center justify-between px-8 h-16 bg-card border-b border-line no-print">
        <span className="font-extrabold text-navy">iEnglish Analytics</span>
        <span className="text-sm text-ink-soft">الإعدادات</span>
      </header>

      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">إعدادات النظام</h1>
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
                <h2 className="font-extrabold text-navy">إدارة الفروع</h2>
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
                <h2 className="font-extrabold text-navy">استيراد ملفات الفروع</h2>
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
      </div>
    </div>
  );
}
