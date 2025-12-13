/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { getLowScoreLogs, getRagSummary, getTopChunks } from "../../../lib/pgpt-insights/cached";

import { Chevron } from "../Chevron";
import { MarkdownView } from "../MarkdownView";
import { MiniBar } from "../MiniBar";
import { formatCompactNumber, formatScore, formatTimestampShort } from "../format";

import { SectionError } from "./SectionError";

function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

export async function RagSection({
  envFilter,
  daysFilter,
  tableDensityClass,
  detailsDefaultOpen,
  truncSecondary,
}: {
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
  detailsDefaultOpen: boolean;
  truncSecondary: number;
}) {
  try {
    const [ragSummary, lowScoreLogs, topChunks] = await Promise.all([
      getRagSummary(envFilter, daysFilter),
      getLowScoreLogs(envFilter, LOW_SCORE_THRESHOLD, daysFilter),
      getTopChunks(envFilter, 20, daysFilter),
    ]);

    return (
      <section id="rag" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
        <details open className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">RAG Health (assistant)</h2>
                <p className="text-xs text-muted-foreground">Retrieval quality overview from assistant maxScore signals.</p>
              </div>
              <div className="flex items-center gap-2">
                {ragSummary ? (
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
                )}
                <Chevron />
              </div>
            </div>
          </summary>

          <div className="mt-4 space-y-3">
            {!ragSummary ? (
              <p className="text-xs text-muted-foreground">No maxScore data yet for the current filters.</p>
            ) : (
              <div className="flex flex-wrap gap-3 text-xs">
                <div>Avg maxScore: {formatScore(ragSummary.avg_max_score)}</div>
                <div>Min maxScore: {formatScore(ragSummary.min_max_score)}</div>
                <div>Max maxScore: {formatScore(ragSummary.max_max_score)}</div>
                <div>Total: {ragSummary.total}</div>
                <div>
                  Low-score (&lt; {ragSummary.threshold}): {ragSummary.low_count}
                </div>
              </div>
            )}

            {lowScoreLogs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Low-score interactions (maxScore &lt; {LOW_SCORE_THRESHOLD})</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className={`w-full min-w-[1200px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                    <colgroup>
                      <col className="w-[220px]" />
                      <col className="w-[100px]" />
                      <col className="w-[220px]" />
                      <col className="w-[320px]" />
                      <col className="w-[360px]" />
                      <col className="w-[120px]" />
                    </colgroup>
                    <thead>
                      <tr>
                            <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  created_at
                                </th>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  env
                                </th>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  session_id
                                </th>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  prompt
                                </th>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                                  response
                                </th>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                                  maxScore
                                </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {lowScoreLogs.map((log) => (
                        <tr key={`low-${log.id}`}>
                          <td className="px-3 py-2 whitespace-normal break-words leading-snug">
                            <span title={String(log.created_at)} className="tabular-nums">
                              {formatTimestampShort(String(log.created_at))}
                            </span>
                          </td>
                          <td className="px-3 py-2">{log.env}</td>
                          <td className="px-3 py-2">
                            {log.session_id ? (
                              <Link
                                href={`/admin/pgpt-insights/session/${encodeURIComponent(log.session_id)}`}
                                className="text-blue-600 underline"
                              >
                                {log.session_id}
                              </Link>
                            ) : (
                              ""
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <details className="group" open={detailsDefaultOpen}>
                              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                <div className="break-words text-xs leading-snug text-foreground">{truncate(log.prompt ?? "", truncSecondary)}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                              </summary>
                              <pre className="mt-2 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">{log.prompt ?? ""}</pre>
                            </details>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <details className="group" open={detailsDefaultOpen}>
                              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                <div className="break-words text-xs leading-snug text-foreground">{truncate(log.response ?? "", truncSecondary)}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">expand</div>
                              </summary>
                              <div className="max-h-[360px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
                                <MarkdownView markdown={log.response ?? ""} />
                              </div>
                            </details>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{log.max_score ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {topChunks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Top retrieved chunks</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className={`w-full min-w-[720px] table-fixed border-collapse text-xs ${tableDensityClass}`}>
                    <colgroup>
                      <col className="w-[560px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead>
                      <tr>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">chunk_id</th>
                                <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">hits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(() => {
                        const maxHits = Math.max(...topChunks.map((c) => c.hits), 1);
                        return topChunks.map((chunk) => (
                          <tr key={chunk.chunk_id}>
                            <td className="px-3 py-2 break-words">{chunk.chunk_id}</td>
                            <td className="px-3 py-2">
                              <MiniBar value={chunk.hits} max={maxHits} />
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </details>
      </section>
    );
  } catch (error) {
    return <SectionError id="rag" title="RAG Health (assistant)" error={error} />;
  }
}
