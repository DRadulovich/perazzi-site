/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { LOGS_PAGE_SIZE } from "../../../lib/pgpt-insights/constants";
import { buildInsightsHref } from "../../../lib/pgpt-insights/href";
import { getOpenQaFlagCount } from "../../../lib/pgpt-insights/cached";
import { fetchLogs } from "../../../lib/pgpt-insights/queries";
import type { PerazziLogPreviewRow } from "../../../lib/pgpt-insights/types";

import { LogsTableWithDrawer } from "../LogsTableWithDrawer";
import { formatCompactNumber } from "../format";
import { TableShell } from "../table/TableShell";

import { SectionError } from "./SectionError";

type SearchParams = {
  env?: string;
  endpoint?: string;
  days?: string;
  q?: string;
  page?: string;
  density?: string;
  view?: string;

  gr_status?: string;
  gr_reason?: string;
  low_conf?: string;
  score?: string;
  archetype?: string;
  model?: string;
  gateway?: string;
  qa?: string;
  winner_changed?: string;
  margin_lt?: string;
  score_archetype?: string;
  min?: string;
  rerank?: string;
  snapped?: string;
};

export async function LogsSection({
  envFilter,
  endpointFilter,
  daysFilter,
  q,
  page,
  resolvedSearchParams,
  tableDensityClass,
  truncPrimary,
}: {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  q: string;
  page: number;
  resolvedSearchParams: SearchParams;
  tableDensityClass: string;
  truncPrimary: number;
}) {
  try {
    const offset = (page - 1) * LOGS_PAGE_SIZE;

    const logsMaybeMore = await fetchLogs({
      envFilter,
      endpointFilter,
      daysFilter,
      q: q.length ? q : undefined,

      gr_status: resolvedSearchParams.gr_status,
      gr_reason: resolvedSearchParams.gr_reason,
      low_conf: resolvedSearchParams.low_conf,
      score: resolvedSearchParams.score,
      archetype: resolvedSearchParams.archetype,
      model: resolvedSearchParams.model,
      gateway: resolvedSearchParams.gateway,
      qa: resolvedSearchParams.qa,
      winner_changed: resolvedSearchParams.winner_changed,
      margin_lt: resolvedSearchParams.margin_lt,
      score_archetype: resolvedSearchParams.score_archetype,
      min: resolvedSearchParams.min,
      rerank: resolvedSearchParams.rerank,
      snapped: resolvedSearchParams.snapped,

      limit: LOGS_PAGE_SIZE + 1,
      offset,
    });

    const hasNextPage = logsMaybeMore.length > LOGS_PAGE_SIZE;
    const logs = logsMaybeMore.slice(0, LOGS_PAGE_SIZE);

    const logsWithQa: PerazziLogPreviewRow[] = logs;

    const qaOpenFlagCount = await getOpenQaFlagCount();
    const qaCountLabel = qaOpenFlagCount > 0 ? ` (${qaOpenFlagCount})` : "";

    const prevHref =
      page > 1
        ? buildInsightsHref({
            env: resolvedSearchParams.env,
            endpoint: resolvedSearchParams.endpoint,
            days: resolvedSearchParams.days,
            q: q.length ? q : undefined,
            page: String(page - 1),
            density: resolvedSearchParams.density,
            view: resolvedSearchParams.view,
            gr_status: resolvedSearchParams.gr_status,
            gr_reason: resolvedSearchParams.gr_reason,
            low_conf: resolvedSearchParams.low_conf,
            score: resolvedSearchParams.score,
            archetype: resolvedSearchParams.archetype,
            model: resolvedSearchParams.model,
            gateway: resolvedSearchParams.gateway,
            qa: resolvedSearchParams.qa,
            winner_changed: resolvedSearchParams.winner_changed,
            margin_lt: resolvedSearchParams.margin_lt,
            score_archetype: resolvedSearchParams.score_archetype,
            min: resolvedSearchParams.min,
            rerank: resolvedSearchParams.rerank,
            snapped: resolvedSearchParams.snapped,
          })
        : null;

    const nextHref = hasNextPage
      ? buildInsightsHref({
          env: resolvedSearchParams.env,
          endpoint: resolvedSearchParams.endpoint,
          days: resolvedSearchParams.days,
          q: q.length ? q : undefined,
          page: String(page + 1),
          density: resolvedSearchParams.density,
          view: resolvedSearchParams.view,
          gr_status: resolvedSearchParams.gr_status,
          gr_reason: resolvedSearchParams.gr_reason,
          low_conf: resolvedSearchParams.low_conf,
          score: resolvedSearchParams.score,
          archetype: resolvedSearchParams.archetype,
          model: resolvedSearchParams.model,
          gateway: resolvedSearchParams.gateway,
          qa: resolvedSearchParams.qa,
          winner_changed: resolvedSearchParams.winner_changed,
          margin_lt: resolvedSearchParams.margin_lt,
          score_archetype: resolvedSearchParams.score_archetype,
          min: resolvedSearchParams.min,
          rerank: resolvedSearchParams.rerank,
          snapped: resolvedSearchParams.snapped,
        })
      : null;

    return (
      <TableShell
        id="logs"
        title="Recent Interactions"
        description="Paginated log viewer (search applies only here). Rows are tinted for fast triage."
        collapsible
        defaultOpen
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
              page {page}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
              shown {formatCompactNumber(logsWithQa.length)}
            </span>
            {q ? (
              <span
                className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                title={q}
              >
                search
              </span>
            ) : null}
          </div>
        }
        contentClassName="space-y-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Page {page}</span>
            {q ? (
              <>
                {" "}
                · Search: <span className="font-medium text-foreground">“{q}”</span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {prevHref ? (
              <Link href={prevHref} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                Previous
              </Link>
            ) : (
              <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground opacity-60">Previous</span>
            )}

            {nextHref ? (
              <Link href={nextHref} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                Next
              </Link>
            ) : (
              <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground opacity-60">Next</span>
            )}

            <Link href="/admin/pgpt-insights/qa" className="ml-2 text-xs text-blue-600 underline">
              QA Review{qaCountLabel}
            </Link>
          </div>
        </div>

        <LogsTableWithDrawer
          logs={logsWithQa}
          tableDensityClass={tableDensityClass}
          truncPrimary={truncPrimary}
        />

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{logsWithQa.length}</span> results on this page.
          </div>
          <div className="flex items-center gap-2">
            {prevHref ? (
              <Link href={prevHref} className="rounded-md border px-2 py-1 hover:bg-muted">
                Previous
              </Link>
            ) : (
              <span className="rounded-md border px-2 py-1 opacity-60">Previous</span>
            )}
            {nextHref ? (
              <Link href={nextHref} className="rounded-md border px-2 py-1 hover:bg-muted">
                Next
              </Link>
            ) : (
              <span className="rounded-md border px-2 py-1 opacity-60">Next</span>
            )}
          </div>
        </div>
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="logs" title="Recent Interactions" error={error} />;
  }
}
