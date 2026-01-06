import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SectionError } from "@/components/pgpt-insights/sections/SectionError";
import { withTimeout } from "@/lib/withTimeout";
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

type SessionLogsPreview = Awaited<ReturnType<typeof fetchSessionLogsPreview>>;
type SessionConversationLogs = Awaited<ReturnType<typeof fetchSessionConversationLogs>>;
type SessionTimelineRows = Awaited<ReturnType<typeof fetchSessionTimelineRows>>;
type SessionLogFilters = Omit<Parameters<typeof fetchSessionLogsPreview>[0], "limit" | "offset">;

function assertPgptInsightsAccess() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }
}

function getSessionIdOrNotFound(params?: { sessionId?: string }): string {
  const sessionId = params?.sessionId;
  if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
    notFound();
  }
  return sessionId;
}

function normalizeQuery(raw?: string) {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, 500);
}

function getTableDensityConfig(densityParam?: string) {
  const isCompact = densityParam === "compact";
  return {
    tableDensityClass: isCompact ? "[&_td]:!py-1 [&_th]:!py-1" : "[&_td]:!py-2 [&_th]:!py-2",
    truncPrimary: isCompact ? 120 : 180,
  };
}

function buildSessionLogFilters(searchParams: SearchParams, sessionId: string, q?: string): SessionLogFilters {
  return {
    sessionId,
    q,
    gr_status: searchParams.gr_status,
    low_conf: searchParams.low_conf,
    score: searchParams.score,
    qa: searchParams.qa,
    winner_changed: searchParams.winner_changed,
    margin_lt: searchParams.margin_lt,
    score_archetype: searchParams.score_archetype,
    min: searchParams.min,
    rerank: searchParams.rerank,
    snapped: searchParams.snapped,
  };
}

function unwrapSettled<T>(result: PromiseSettledResult<T>) {
  if (result.status === "fulfilled") {
    return { value: result.value, error: null };
  }
  return { value: null, error: result.reason };
}

function getLogsWithLimit<T>(logs: T[] | null, limit: number) {
  if (!logs) {
    return { logs: [], hasMore: false };
  }

  const hasMore = logs.length > limit;
  const trimmedLogs = hasMore ? logs.slice(0, limit) : logs;

  return { logs: trimmedLogs, hasMore };
}

async function fetchSessionData(filters: SessionLogFilters) {
  const [logsRes, convRes, timelineRes] = await Promise.allSettled([
    withTimeout(
      fetchSessionLogsPreview({
        ...filters,
        limit: SESSION_LOGS_LIMIT + 1,
        offset: 0,
      }),
      30000,
      "Logs query timed out",
    ),
    withTimeout(
      fetchSessionConversationLogs({
        ...filters,
        limit: SESSION_LOGS_LIMIT,
        offset: 0,
      }),
      30000,
      "Conversation query timed out",
    ),
    withTimeout(
      fetchSessionTimelineRows({ sessionId: filters.sessionId, limit: 2000, offset: 0 }),
      30000,
      "Timeline query timed out",
    ),
  ] as const);

  const logsResult = unwrapSettled(logsRes);
  const convResult = unwrapSettled(convRes);
  const timelineResult = unwrapSettled(timelineRes);

  const { logs, hasMore } = getLogsWithLimit(logsResult.value, SESSION_LOGS_LIMIT);

  return {
    logs,
    hasMore,
    conversationLogs: convResult.value ?? [],
    timelineRows: timelineResult.value,
    logsError: logsResult.error,
    convError: convResult.error,
    timelineError: timelineResult.error,
  };
}

function renderTimelineSection(timelineRows: SessionTimelineRows | null, timelineError: unknown | null) {
  if (timelineRows) {
    return <ArchetypeTimeline rows={timelineRows} />;
  }

  return <SectionError id="timeline" title="Archetype Timeline" error={timelineError} />;
}

function renderLogsSection({
  logsError,
  convError,
  logs,
  conversationLogs,
  tableDensityClass,
  truncPrimary,
  hasMore,
  sessionId,
}: {
  logsError: unknown | null;
  convError: unknown | null;
  logs: SessionLogsPreview;
  conversationLogs: SessionConversationLogs;
  tableDensityClass: string;
  truncPrimary: number;
  hasMore: boolean;
  sessionId: string;
}) {
  if (logsError || convError) {
    return <SectionError id="logs" title="Session Logs" error={logsError ?? convError} />;
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 text-sm text-muted-foreground">
        No interactions match the current filters.
      </div>
    );
  }

  return (
    <SessionLogsView
      tableLogs={logs}
      conversationLogs={conversationLogs}
      tableDensityClass={tableDensityClass}
      truncPrimary={truncPrimary}
      hasMore={hasMore}
      sessionId={sessionId}
    />
  );
}

export default async function PgptInsightsSessionPage({
  params,
  searchParams,
}: {
  params?: Promise<{ sessionId?: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  assertPgptInsightsAccess();

  const resolvedParams = (await params) ?? {};
  const resolvedSearchParams = (await searchParams) ?? {};
  const sessionId = getSessionIdOrNotFound(resolvedParams);

  const q = normalizeQuery(resolvedSearchParams.q);
  const { tableDensityClass, truncPrimary } = getTableDensityConfig(resolvedSearchParams.density);
  const filters = buildSessionLogFilters(resolvedSearchParams, sessionId, q);

  const {
    logs,
    hasMore,
    conversationLogs,
    timelineRows,
    logsError,
    convError,
    timelineError,
  } = await fetchSessionData(filters);

  const timelineSection = renderTimelineSection(timelineRows, timelineError);
  const logsSection = renderLogsSection({
    logsError,
    convError,
    logs,
    conversationLogs,
    tableDensityClass,
    truncPrimary,
    hasMore,
    sessionId,
  });

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

      {timelineSection}

      <SessionFilters />

      <section id="logs" className="space-y-3 min-w-0">
        {logsSection}
      </section>
    </div>
  );
}
