import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  fetchSessionConversationLogs,
  fetchSessionLogsPreview,
  fetchSessionTimelineRows,
} from "@/lib/pgpt-insights/queries";
import { ArchetypeTimeline } from "./components/ArchetypeTimeline";
import { SessionFilters } from "./components/SessionFilters";
import { SessionIdentity } from "./components/SessionIdentity";
import { SessionLogsView } from "./components/SessionLogsView";
import { SessionSummary } from "./components/SessionSummary";

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
  rerank?: string;
  snapped?: string;
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
    rerank: resolvedSearchParams.rerank,
    snapped: resolvedSearchParams.snapped,

    limit: SESSION_LOGS_LIMIT + 1,
    offset: 0,
  });

  const hasMore = logsMaybeMore.length > SESSION_LOGS_LIMIT;
  const logs = hasMore ? logsMaybeMore.slice(0, SESSION_LOGS_LIMIT) : logsMaybeMore;
  const conversationLogs = await fetchSessionConversationLogs({
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
    rerank: resolvedSearchParams.rerank,
    snapped: resolvedSearchParams.snapped,

    limit: SESSION_LOGS_LIMIT,
    offset: 0,
  });
  const timelineRows = await fetchSessionTimelineRows({ sessionId, limit: 2000, offset: 0 });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumb="Session"
        title="Session Explorer"
        description="Per-session summary, timeline, and logs."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/pgpt-insights"
              className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              Insights
            </Link>
            <Link href="/admin/pgpt-insights/qa" className="text-xs font-medium text-blue-600 underline">
              QA Review
            </Link>
          </div>
        }
      />

      <SessionIdentity
        sessionId={sessionId}
        interactionCount={logs.length}
        hasMore={hasMore}
        limit={SESSION_LOGS_LIMIT}
      />

      <SessionSummary sessionId={sessionId} />

      <ArchetypeTimeline rows={timelineRows} />

      <SessionFilters />

      <section id="logs" className="space-y-3 min-w-0">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 text-sm text-muted-foreground">
            No interactions match the current filters.
          </div>
        ) : (
          <SessionLogsView
            tableLogs={logs}
            conversationLogs={conversationLogs}
            tableDensityClass={tableDensityClass}
            truncPrimary={truncPrimary}
            hasMore={hasMore}
            sessionId={sessionId}
          />
        )}
      </section>
    </div>
  );
}
