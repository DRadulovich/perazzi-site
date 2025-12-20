import { redirect } from "next/navigation";
import { Pool } from "pg";
import { logTlsDiagForDb } from "@/lib/tlsDiag";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
logTlsDiagForDb("pg.qa.flag.pool", process.env.DATABASE_URL);

const ALLOWED_REASONS = new Set([
  "hallucination",
  "bad_tone",
  "wrong_retrieval",
  "guardrail_false_positive",
  "guardrail_false_negative",
  "other",
]);

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function sanitizeReason(value: unknown): string {
  const raw = String(value ?? "").trim();
  return ALLOWED_REASONS.has(raw) ? raw : "other";
}

function sanitizeNotes(value: unknown): string | null {
  const raw = String(value ?? "")
    .replaceAll(/\r\n/g, "\n")
    .trim();

  if (!raw) return null;

  // Hard limit server-side (avoid giant payloads / logs / DB bloat)
  const clipped = raw.slice(0, 500);

  // Keep notes single-line-ish if user pastes multiline
  return clipped.replaceAll(/\s*\n\s*/g, " ").trim() || null;
}

function normalizeFallback(referer: string | null, defaultPath: string): string {
  const raw = String(referer ?? "").trim();
  if (!raw) return defaultPath;

  // If we already have a same-site path, use it.
  if (raw.startsWith("/")) return raw;

  // If a full URL is provided, strip it down to a same-site path.
  try {
    const url = new URL(raw);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("/") ? path : defaultPath;
  } catch {
    return defaultPath;
  }
}

function safeReturnTo(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  // prevent open redirects: only allow same-site paths
  if (raw.startsWith("/")) return raw;
  return fallback;
}

export async function POST(req: Request) {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    return new Response("Not found", { status: 404 });
  }

  const formData = await req.formData();

  const interactionIdRaw = String(formData.get("interactionId") ?? "").trim();
  const reason = sanitizeReason(formData.get("reason"));
  const notes = sanitizeNotes(formData.get("notes"));

  const fallback = normalizeFallback(req.headers.get("referer"), "/admin/pgpt-insights/qa");
  const returnTo = safeReturnTo(formData.get("returnTo"), fallback);

  if (!interactionIdRaw || !isUuidLike(interactionIdRaw)) {
    redirect(returnTo);
  }

  // Best-effort strong-ish duplicate prevention:
  // - Take an advisory lock scoped to this interactionId for the duration of the transaction
  // - Check for existing open flag
  // - Insert only if none exists
  const client = await pool.connect();
  try {
    await client.query("begin");

    // hashtext returns int4; advisory lock can accept bigint (implicit cast)
    await client.query("select pg_advisory_xact_lock(hashtext($1));", [interactionIdRaw]);

    const existing = await client.query<{ id: string }>(
      `
        select id
        from qa_flags
        where interaction_id = $1::uuid and status = 'open'
        order by created_at desc
        limit 1;
      `,
      [interactionIdRaw],
    );

    if (existing.rows.length === 0) {
      await client.query(
        `
          insert into qa_flags (interaction_id, reason, notes, status)
          values ($1::uuid, $2, $3, 'open');
        `,
        [interactionIdRaw, reason, notes],
      );
    }

    await client.query("commit");
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // ignore
    }
    console.error("[qa/flag] Failed to create QA flag", error);
    // Still redirect; keep UX simple/reliable
  } finally {
    client.release();
  }

  redirect(returnTo);
}
