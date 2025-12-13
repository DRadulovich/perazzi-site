import { redirect } from "next/navigation";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
  const flagIdRaw = String(formData.get("flagId") ?? "").trim();

  const fallback = req.headers.get("referer") ?? "/admin/pgpt-insights/qa";
  const returnTo = safeReturnTo(formData.get("returnTo"), fallback);

  if (!flagIdRaw || !isUuidLike(flagIdRaw)) {
    redirect(returnTo);
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    // Best-effort concurrency safety: serialize resolve operations per flag id.
    await client.query("select pg_advisory_xact_lock(hashtext($1));", [flagIdRaw]);

    // Only resolve if it's currently open.
    await client.query(
      "update qa_flags set status = 'resolved' where id = $1::uuid and status = 'open';",
      [flagIdRaw],
    );

    await client.query("commit");
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // ignore
    }
    console.error("[qa/resolve] Failed to resolve QA flag", error);
    // Still redirect; keep UX simple/reliable.
  } finally {
    client.release();
  }

  redirect(returnTo);
}