/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { getLowScoreLogs, getRagSummary, getTopChunks } from "../../../lib/pgpt-insights/cached";

import { MarkdownView } from "../MarkdownView";
import { MiniBar } from "../MiniBar";
import { formatCompactNumber, formatScore, formatTimestampShort } from "../format";
import { DataTable } from "../table/DataTable";
import { MonoCell } from "../table/MonoCell";
import { RowLimiter } from "../table/RowLimiter";
import { StatusBadge } from "../table/StatusBadge";
import { TableShell } from "../table/TableShell";
import { TruncateCell } from "../table/TruncateCell";

import { SectionError } from "./SectionError";
import { NoDataCard } from "@/components/pgpt-insights/common/NoDataCard";

export async function RagSection({
  envFilter,
  daysFilter,
  tableDensityClass,
  detailsDefaultOpen,
  truncSecondary,
}: Readonly<{
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
  detailsDefaultOpen: boolean;
  truncSecondary: number;
}>) {
  try {
    const [ragSummary, lowScoreLogs, topChunks] = await Promise.all([
      getRagSummary(envFilter, daysFilter),
      getLowScoreLogs(envFilter, LOW_SCORE_THRESHOLD, daysFilter),
      getTopChunks(envFilter, 20, daysFilter),
    ]);

    if (!ragSummary && lowScoreLogs.length === 0 && topChunks.length === 0) {
      return (
        <NoDataCard title="RAG Health (assistant)" hint="Adjust filters to see data." />
      );
    }

    return (
      <TableShell
        id="rag"
        title="RAG Health (assistant)"
        description="Retrieval quality overview from assistant maxScore signals."
        collapsible
        defaultOpen
        actions={
          ragSummary ? (
            <>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                avg {formatScore(ragSummary.avg_max_score)}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                low {formatCompactNumber(ragSummary.low_count)}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              no data
            </span>
          )
        }
        contentClassName="space-y-3"
      >
        {ragSummary ? (
          <div className="flex flex-wrap gap-3 text-xs">
            <div>Avg maxScore: {formatScore(ragSummary.avg_max_score)}</div>
            <div>Min maxScore: {formatScore(ragSummary.min_max_score)}</div>
            <div>Max maxScore: {formatScore(ragSummary.max_max_score)}</div>
            <div>Total: {ragSummary.total}</div>
            <div>
              Low-score (&lt; {ragSummary.threshold}): {ragSummary.low_count}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No maxScore data yet for the current filters.</p>
        )}

        {lowScoreLogs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Low-score interactions (maxScore &lt; {LOW_SCORE_THRESHOLD})</h3>
            <DataTable
              headers={[
                { key: "created_at", label: "created_at" },
                { key: "env", label: "env" },
                { key: "session_id", label: "session_id" },
                { key: "prompt", label: "prompt" },
                { key: "response", label: "response" },
                { key: "maxscore", label: "maxScore", align: "right" },
              ]}
              colgroup={
                <colgroup>
                  <col className="w-[220px]" />
                  <col className="w-[100px]" />
                  <col className="w-[220px]" />
                  <col className="w-80" />
                  <col className="w-[360px]" />
                  <col className="w-[120px]" />
                </colgroup>
              }
              minWidth="min-w-[1200px]"
              tableDensityClass={tableDensityClass}
            >
              <RowLimiter colSpan={6} defaultVisible={10} label="logs">
                {lowScoreLogs.map((log) => (
                  <tr key={`low-${log.id}`} className="border-l-[5px] border-yellow-500/70">
                    <td className="whitespace-normal wrap-break-word leading-snug">
                      <span title={String(log.created_at)} className="tabular-nums">
                        {formatTimestampShort(String(log.created_at))}
                      </span>
                    </td>
                    <td>
                      <StatusBadge type="env" value={log.env} />
                    </td>
                    <td>
                      {log.session_id ? (
                        <Link
                          href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                          className="text-blue-600 underline"
                        >
                          <MonoCell>{log.session_id}</MonoCell>
                        </Link>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="align-top">
                      <TruncateCell
                        text={log.prompt ?? ""}
                        previewChars={truncSecondary}
                        defaultOpen={detailsDefaultOpen}
                      >
                        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                          {log.prompt ?? ""}
                        </pre>
                      </TruncateCell>
                    </td>
                    <td className="align-top">
                      <TruncateCell
                        text={log.response ?? ""}
                        previewChars={truncSecondary}
                        defaultOpen={detailsDefaultOpen}
                      >
                        <div className="max-h-[360px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
                          <MarkdownView markdown={log.response ?? ""} />
                        </div>
                      </TruncateCell>
                    </td>
                    <td className="text-right">
                      <StatusBadge type="score" value={log.max_score ?? null} />
                    </td>
                  </tr>
                ))}
              </RowLimiter>
            </DataTable>
          </div>
        )}

        {topChunks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Top retrieved chunks</h3>
            <DataTable
              headers={[
                { key: "chunk_id", label: "chunk_id" },
                { key: "hits", label: "hits", align: "right" },
              ]}
              colgroup={
                <colgroup>
                  <col className="w-[560px]" />
                  <col className="w-[140px]" />
                </colgroup>
              }
              minWidth="min-w-[720px]"
              tableDensityClass={tableDensityClass}
            >
              <RowLimiter colSpan={2} defaultVisible={12} label="chunks">
                {(() => {
                  const maxHits = Math.max(...topChunks.map((c) => c.hits), 1);
                  return topChunks.map((chunk) => (
                    <tr key={chunk.chunk_id}>
                      <td className="wrap-break-word">
                        <MonoCell>{chunk.chunk_id}</MonoCell>
                      </td>
                      <td>
                        <MiniBar value={chunk.hits} max={maxHits} />
                      </td>
                    </tr>
                  ));
                })()}
              </RowLimiter>
            </DataTable>
          </div>
        )}
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="rag" title="RAG Health (assistant)" error={error} />;
  }
}
