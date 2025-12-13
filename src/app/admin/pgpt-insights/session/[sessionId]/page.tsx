import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchSessionLogsPreview, fetchSessionTimelineRows } from "../../../../../lib/pgpt-insights/queries";
import { CopyButton } from "../../../../../components/pgpt-insights/CopyButton";
import { LogsTableWithDrawer } from "../../../../../components/pgpt-insights/LogsTableWithDrawer";
import { SessionArchetypeTimeline } from "../../../../../components/pgpt-insights/session/SessionArchetypeTimeline";
import { SessionFiltersBar } from "../../../../../components/pgpt-insights/session/SessionFiltersBar";
import { SessionSummarySection } from "../../../../../components/pgpt-insights/session/SessionSummarySection";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  qa?: string;
  gr_status?: string;
  low_conf?: string;
  score?: string;
  density?: string;
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
};

const SESSION_LOGS_LIMIT = 2000;

export default async function PgptInsightsSessionPage({
  params,
  searchParams,
}: {
  params?: Promise<{ sessionId?: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = (await params) ?? {};
  const resolvedSearchParams = (await searchParams) ?? {};
  const sessionId = resolvedParams.sessionId;

  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
    notFound();
  }

  const qRaw = (resolvedSearchParams.q ?? "").trim();
  const q = qRaw.length ? qRaw.slice(0, 500) : undefined;

  const densityParam = resolvedSearchParams.density;
  const density = densityParam === "compact" ? "compact" : "comfortable";
  const isCompact = density === "compact";

  const tableDensityClass = isCompact ? "[&_td]:!py-1 [&_th]:!py-1" : "[&_td]:!py-2 [&_th]:!py-2";
  const truncPrimary = isCompact ? 120 : 180;

  const logsMaybeMore = await fetchSessionLogsPreview({
    sessionId,
    q,

    gr_status: resolvedSearchParams.gr_status,
    low_conf: resolvedSearchParams.low_conf,
    score: resolvedSearchParams.score,
    qa: resolvedSearchParams.qa,
    winner_changed: resolvedSearchParams.winner_changed,
    margin_lt: resolvedSearchParams.margin_lt,
    score_archetype: resolvedSearchParams.score_archetype,
    min: resolvedSearchParams.min,

    limit: SESSION_LOGS_LIMIT + 1,
    offset: 0,
  });

  const hasMore = logsMaybeMore.length > SESSION_LOGS_LIMIT;
  const logs = hasMore ? logsMaybeMore.slice(0, SESSION_LOGS_LIMIT) : logsMaybeMore;
  const timelineRows = await fetchSessionTimelineRows({ sessionId, limit: 2000, offset: 0 });

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      <main className="mx-auto w-full max-w-6xl min-w-0 px-6 py-12 md:py-14 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Perazzi · Workshop</p>
            <h1 className="text-2xl font-semibold tracking-tight">Session Explorer</h1>
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span>Session:</span>
              <span className="font-medium text-foreground break-all">{sessionId}</span>
              <CopyButton value={sessionId} label="Copy" ariaLabel="Copy session id" />
              <span className="text-muted-foreground">·</span>
              <span className="font-medium text-foreground">
                {hasMore ? `${SESSION_LOGS_LIMIT}+` : String(logs.length)}
              </span>{" "}
              interactions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/pgpt-insights" className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
              Back to Insights
            </Link>
            <Link href="/admin/pgpt-insights/qa" className="text-xs text-blue-600 underline">
              QA Review
            </Link>
          </div>
        </header>

        <SessionSummarySection sessionId={sessionId} />

        <SessionArchetypeTimeline rows={timelineRows} />

        <SessionFiltersBar />

        <section id="logs" className="space-y-3 min-w-0">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 text-sm text-muted-foreground">
              No interactions match the current filters.
            </div>
          ) : (
            <LogsTableWithDrawer
              logs={logs}
              tableDensityClass={tableDensityClass}
              truncPrimary={truncPrimary}
              isCompact={isCompact}
            />
          )}
        </section>
      </main>
    </div>
  );
}
