import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";

type PerazziSessionLogRow = {
  id: string;
  created_at: Date;
  env: string;
  endpoint: string;
  session_id: string | null;
  model: string | null;
  used_gateway: boolean | null;
  prompt: string;
  response: string;
  low_confidence: boolean | null;
  intents: string[] | null;
  topics: string[] | null;
  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchSessionLogs(sessionId: string): Promise<PerazziSessionLogRow[]> {
  const query = `
    select
      id,
      created_at,
      env,
      endpoint,
      session_id,
      model,
      used_gateway,
      prompt,
      response,
      low_confidence,
      intents,
      topics,
      metadata->>'maxScore' as max_score,
      metadata->>'guardrailStatus' as guardrail_status,
      metadata->>'guardrailReason' as guardrail_reason
    from perazzi_conversation_logs
    where session_id = $1
    order by created_at asc;
  `;
  const { rows } = await pool.query<PerazziSessionLogRow>(query, [sessionId]);
  return rows;
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<ReactElement> {
  const resolvedParams = await params;
  const { sessionId } = resolvedParams;
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  const logs = await fetchSessionLogs(sessionId);
  const envs = Array.from(
    new Set(logs.map((log) => log.env).filter((env): env is string => Boolean(env))),
  );
  const displaySessionId = sessionId.length > 12 ? `${sessionId.slice(0, 12)}...` : sessionId;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-lg font-semibold tracking-tight" title={sessionId}>
            Session {displaySessionId}
          </h1>
          <Link href="/admin/pgpt-insights" className="text-xs text-blue-600 underline">
            Back to insights
          </Link>
        </header>

        <section className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Session timeline</h2>
            {envs.length > 0 && (
              <div className="text-[11px] text-muted-foreground">Envs: {envs.join(", ")}</div>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs found for this session.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const backgroundClass =
                  log.guardrail_status === "blocked"
                    ? "bg-red-50/80"
                    : log.low_confidence
                    ? "bg-amber-50/80"
                    : "bg-card/80";
                return (
                  <div key={log.id} className={`${backgroundClass} rounded-xl border p-3 sm:p-4 space-y-2`}>
                    <div className="text-[11px] text-muted-foreground space-x-1">
                      <span>{String(log.created_at)}</span>
                      <span>•</span>
                      <span>{log.env}</span>
                      <span>•</span>
                      <span>{log.endpoint}</span>
                      {log.max_score && (
                        <>
                          <span>•</span>
                          <span>maxScore: {log.max_score}</span>
                        </>
                      )}
                      {log.guardrail_status && (
                        <>
                          <span>•</span>
                          <span>
                            guardrail: {log.guardrail_status}
                            {log.guardrail_reason ? ` (${log.guardrail_reason})` : ""}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>
                        <div className="font-semibold">Prompt:</div>
                        <div className="whitespace-pre-wrap leading-snug">{log.prompt}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Response:</div>
                        <div className="whitespace-pre-wrap leading-snug">{log.response}</div>
                      </div>
                    </div>
                    {(log.intents || log.topics) && (
                      <div className="text-[11px] text-muted-foreground">
                        {log.intents && log.intents.length > 0 && <span>Intents: {log.intents.join(", ")} </span>}
                        {log.topics && log.topics.length > 0 && <span>Topics: {log.topics.join(", ")}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
