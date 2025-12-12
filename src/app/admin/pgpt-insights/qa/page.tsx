import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";

type QaFlagRow = {
  id: string;
  created_at: Date;
  interaction_id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  env: string;
  endpoint: string;
  session_id: string | null;
  model: string | null;
  prompt: string;
  response: string;
  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchOpenFlags(): Promise<QaFlagRow[]> {
  const query = `
    select
      f.id,
      f.created_at,
      f.interaction_id,
      f.status,
      f.reason,
      f.notes,
      l.env,
      l.endpoint,
      l.session_id,
      l.model,
      l.prompt,
      l.response,
      l.metadata->>'maxScore' as max_score,
      l.metadata->>'guardrailStatus' as guardrail_status,
      l.metadata->>'guardrailReason' as guardrail_reason
    from qa_flags f
    join perazzi_conversation_logs l
      on f.interaction_id = l.id
    where f.status = 'open'
    order by f.created_at desc
    limit 100;
  `;
  const { rows } = await pool.query<QaFlagRow>(query);
  return rows;
}

export default async function QaReviewPage() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  const flags = await fetchOpenFlags();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-xl font-semibold tracking-tight">QA Review</h1>
          <Link href="/admin/pgpt-insights" className="text-xs text-blue-600 underline">
            Back to insights
          </Link>
        </header>

        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open QA flags.</p>
        ) : (
          <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">Open QA flags</h2>
              <p className="text-xs text-muted-foreground">Resolve flagged interactions to close the loop.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Created</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Env</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Endpoint</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Prompt</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Response</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">maxScore</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Guardrail</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Reason</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Notes</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {flags.map((flag) => (
                    <tr key={flag.id}>
                      <td className="px-2 py-1 whitespace-nowrap">{String(flag.created_at)}</td>
                      <td className="px-2 py-1">{flag.env}</td>
                      <td className="px-2 py-1">{flag.endpoint}</td>
                      <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                        {flag.prompt.length > 160 ? `${flag.prompt.slice(0, 160)}...` : flag.prompt}
                      </td>
                      <td className="px-2 py-1 align-top whitespace-pre-wrap leading-snug">
                        {flag.response.length > 160 ? `${flag.response.slice(0, 160)}...` : flag.response}
                      </td>
                      <td className="px-2 py-1">{flag.max_score ?? ""}</td>
                      <td className="px-2 py-1">
                        {flag.guardrail_status
                          ? `${flag.guardrail_status}${flag.guardrail_reason ? ` (${flag.guardrail_reason})` : ""}`
                          : ""}
                      </td>
                      <td className="px-2 py-1">{flag.reason ?? ""}</td>
                      <td className="px-2 py-1">{flag.notes ?? ""}</td>
                      <td className="px-2 py-1">
                        <form method="POST" action="/admin/pgpt-insights/qa/resolve" className="inline-flex">
                          <input type="hidden" name="flagId" value={flag.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background"
                          >
                            Mark resolved
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
