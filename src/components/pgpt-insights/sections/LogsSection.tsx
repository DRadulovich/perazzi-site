/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { LOGS_PAGE_SIZE } from "../../../lib/pgpt-insights/constants";
import { buildInsightsHref } from "../../../lib/pgpt-insights/href";
import { getOpenQaFlagCount } from "../../../lib/pgpt-insights/cached";
import { fetchLogs } from "../../../lib/pgpt-insights/queries";
import type { PerazziLogPreviewRow } from "../../../lib/pgpt-insights/types";

import { LogsTableWithDrawer } from "../LogsTableWithDrawer";
import { NoDataCard } from "@/components/pgpt-insights/common/NoDataCard";
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

type LogsSectionProps = Readonly<{
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  q: string;
  page: number;
  resolvedSearchParams: SearchParams;
  tableDensityClass: string;
  truncPrimary: number;
}>;

type PaginationLinksProps = Readonly<{
  prevHref: string | null;
  nextHref: string | null;
  linkClassName: string;
  disabledClassName: string;
}>;

const normalizeQuery = (query: string) => (query.length ? query : undefined);

const formatQaCountLabel = (qaOpenFlagCount: number) =>
  qaOpenFlagCount > 0 ? ` (${qaOpenFlagCount})` : "";

const buildPaginationHrefs = (
  resolvedSearchParams: SearchParams,
  query: string | undefined,
  page: number,
  hasNextPage: boolean,
) => {
  const hrefParams = { ...resolvedSearchParams, q: query };

  return {
    prevHref: page > 1 ? buildInsightsHref({ ...hrefParams, page: String(page - 1) }) : null,
    nextHref: hasNextPage ? buildInsightsHref({ ...hrefParams, page: String(page + 1) }) : null,
  };
};

function PaginationLinks({ prevHref, nextHref, linkClassName, disabledClassName }: PaginationLinksProps) {
  return (
    <>
      {prevHref ? (
        <Link href={prevHref} className={linkClassName}>
          Previous
        </Link>
      ) : (
        <span className={disabledClassName}>Previous</span>
      )}
      {nextHref ? (
        <Link href={nextHref} className={linkClassName}>
          Next
        </Link>
      ) : (
        <span className={disabledClassName}>Next</span>
      )}
    </>
  );
}

export async function LogsSection({
  envFilter,
  endpointFilter,
  daysFilter,
  q,
  page,
  resolvedSearchParams,
  tableDensityClass,
  truncPrimary,
}: LogsSectionProps) {
  try {
    const offset = (page - 1) * LOGS_PAGE_SIZE;
    const query = normalizeQuery(q);

    const logsMaybeMore = await fetchLogs({
      envFilter,
      endpointFilter,
      daysFilter,
      q: query,

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

    if (logsWithQa.length === 0) {
      return <NoDataCard title="Recent Interactions" hint="Adjust filters" />;
    }

    const qaOpenFlagCount = await getOpenQaFlagCount();
    const qaCountLabel = formatQaCountLabel(qaOpenFlagCount);
    const { prevHref, nextHref } = buildPaginationHrefs(resolvedSearchParams, query, page, hasNextPage);

    return (
      <TableShell
        id="logs"
        title="Recent Interactions"
        description="Paginated log viewer (search applies only here). Severity is conveyed via the left stripe."
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
            <PaginationLinks
              prevHref={prevHref}
              nextHref={nextHref}
              linkClassName="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              disabledClassName="rounded-md border px-2 py-1 text-xs text-muted-foreground opacity-60"
            />

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
            <PaginationLinks
              prevHref={prevHref}
              nextHref={nextHref}
              linkClassName="rounded-md border px-2 py-1 hover:bg-muted"
              disabledClassName="rounded-md border px-2 py-1 opacity-60"
            />
          </div>
        </div>
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="logs" title="Recent Interactions" error={error} />;
  }
}
