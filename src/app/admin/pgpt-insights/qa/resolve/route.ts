import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { pool } from "../../../../../lib/db";

export const runtime = "nodejs";

function isSafeSameSitePath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  return !value.includes("\r") && !value.includes("\n");
}

function safeReturnTo(reqUrl: string, returnTo: string | null): URL {
  const base = new URL(reqUrl);
  const fallback = new URL("/admin/pgpt-insights/qa", base);
  if (!returnTo) return fallback;

  const raw = returnTo.trim();
  if (!isSafeSameSitePath(raw)) return fallback;

  return new URL(raw, base);
}

export async function POST(req: Request) {
  const authResp = await requireAdmin();
  if (authResp) return authResp;
  const form = await req.formData();

  const flagId = String(form.get("flagId") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "").trim() || null;
  const redirectUrl = safeReturnTo(req.url, returnTo);

  if (!flagId) return NextResponse.redirect(redirectUrl);

  await pool.query(
    `
      update qa_flags
      set
        status = 'resolved',
        notes = case when $2 <> '' then $2 else notes end
      where id::text = $1;
    `,
    [flagId, notes],
  );

  return NextResponse.redirect(redirectUrl);
}
