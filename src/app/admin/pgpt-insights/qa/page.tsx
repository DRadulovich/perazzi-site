import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getPgSslDiagnostics, getPgSslOptions } from "@/lib/pgSsl";
import { logTlsDiagForDb } from "@/lib/tlsDiag";
import { QaFilters } from "./components/QaFilters";
import { QaTable, type QaRow } from "./components/QaTable";

type QaSearchParams = {
  status?: string;
  q?: string;
};

const QA_STATUS_VALUES = ["open", "resolved", "all"] as const;
type QaStatus = (typeof QA_STATUS_VALUES)[number];

const { sslMode: qaSslMode, hasCa: qaHasCa } = getPgSslDiagnostics();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: getPgSslOptions() });
logTlsDiagForDb("pg.qa.page.pool", process.env.DATABASE_URL, qaSslMode, { hasCa: qaHasCa });

async function resolveSearchParams(searchParams?: Promise<QaSearchParams>): Promise<QaSearchParams> {
  return (await searchParams) ?? {};
}

function enforcePgptInsightsAccess(): void {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }
}

function normalizeStatus(value?: string): QaStatus {
  const status = (value ?? "open").trim();
  return QA_STATUS_VALUES.includes(status as QaStatus) ? (status as QaStatus) : "open";
}

function normalizeQuery(value?: string): string {
  const q = (value ?? "").trim();
  return q.length > 0 ? q.slice(0, 200) : "";
}

function buildCurrentHref(status: QaStatus, q: string): string {
  const params = new URLSearchParams({ status });
  if (q) {
    params.set("q", q);
  }
  return `/admin/pgpt-insights/qa?${params.toString()}`;
}

function formatOpenCountLabel(openCount: number): string {
  return openCount > 0 ? ` (${openCount})` : "";
}

async function fetchOpenCount(): Promise<number> {
  const { rows } = await pool.query<{ open_count: string | number }>(
    `select count(*) as open_count from qa_flags where status = 'open';`,
  );
  return Number(rows[0]?.open_count ?? 0);
}

async function fetchQaFlags(args: { status?: QaStatus; q?: string; limit: number }): Promise<QaRow[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let idx = 1;

  if (args.status && args.status !== "all") {
    conditions.push(`f.status = $${idx++}`);
    params.push(args.status);
  }

  if (args.q && args.q.trim().length > 0) {
    const q = `%${args.q.trim()}%`;
    conditions.push(
      `(f.reason ILIKE $${idx} OR f.notes ILIKE $${idx} OR l.prompt ILIKE $${idx} OR l.response ILIKE $${idx})`,
    );
    params.push(q);
    idx += 1;
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

  params.push(args.limit);
  const limitParamIndex = idx;

  const query = `
    select
      f.id as flag_id,
      f.created_at as flag_created_at,
      f.status as flag_status,
      f.reason as flag_reason,
      f.notes as flag_notes,
      f.interaction_id::text as interaction_id,

      l.created_at as interaction_created_at,
      l.env,
      l.endpoint,
      l.archetype,
      l.session_id,
      l.prompt,
      l.response,
      l.low_confidence,
      l.metadata->>'maxScore' as max_score,
      l.metadata->>'guardrailStatus' as guardrail_status,
      l.metadata->>'guardrailReason' as guardrail_reason
    from qa_flags f
    join perazzi_conversation_logs l on l.id = f.interaction_id
    ${whereClause}
    order by (case when f.status = 'open' then 0 else 1 end), f.created_at desc
    limit $${limitParamIndex};
  `;

  const { rows } = await pool.query<QaRow>(query, params);
  return rows;
}

async function fetchQaData(status: QaStatus, q: string): Promise<{ openCount: number; rows: QaRow[] }> {
  const [openCount, rows] = await Promise.all([
    fetchOpenCount(),
    fetchQaFlags({ status, q: q.length ? q : undefined, limit: 250 }),
  ]);
  return { openCount, rows };
}

export default async function PgptInsightsQaPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<QaSearchParams>;
}>) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);

  enforcePgptInsightsAccess();

  const status = normalizeStatus(resolvedSearchParams.status);
  const q = normalizeQuery(resolvedSearchParams.q);

  const { openCount, rows } = await fetchQaData(status, q);

  const qaCountLabel = formatOpenCountLabel(openCount);
  const currentHref = buildCurrentHref(status, q);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumb="QA Review"
        title={`QA Review${qaCountLabel}`}
        description="Flagged interactions with reason + notes."
        actions={
          <Link
            href="/admin/pgpt-insights"
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            Back to Insights
          </Link>
        }
      />

      <QaFilters status={status} q={q} />

      <QaTable rows={rows} currentHref={currentHref} />
    </div>
  );
}
