import { NextResponse } from "next/server";
import { applyImport } from "@/lib/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/import  — used by the Google Sheets Apps Script.
// Auth: header  x-import-token: <IMPORT_TOKEN>
export async function POST(req: Request) {
  const token = process.env.IMPORT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "IMPORT_TOKEN not configured on the server" },
      { status: 500 },
    );
  }
  const provided =
    req.headers.get("x-import-token") ||
    new URL(req.url).searchParams.get("token");
  if (provided !== token) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Accept either an array, or { rows: [...] }
  const items = Array.isArray(body)
    ? body
    : Array.isArray((body as { rows?: unknown })?.rows)
      ? (body as { rows: unknown[] }).rows
      : null;
  if (!items) {
    return NextResponse.json(
      { ok: false, error: "Expected an array of rows" },
      { status: 400 },
    );
  }

  try {
    const res = await applyImport(items as Parameters<typeof applyImport>[0]);
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 },
    );
  }
}
