import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";

export const runtime = "nodejs";

function safeReturnTo(reqUrl: string, returnTo: string | null): URL {
  const base = new URL(reqUrl);
  const fallback = new URL("/admin/pgpt-insights/qa", base);
  if (!returnTo) return fallback;

  // Only allow same-origin relative redirects
  if (!returnTo.startsWith("/")) return fallback;

  return new URL(returnTo, base);
}

export async function POST(req: Request) {
  const form = await req.formData();

  const flagId = String(form.get("flagId") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "").trim() || null;

  if (!flagId) {
    return NextResponse.redirect(safeReturnTo(req.url, returnTo));
  }

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

  return NextResponse.redirect(safeReturnTo(req.url, returnTo));
}
