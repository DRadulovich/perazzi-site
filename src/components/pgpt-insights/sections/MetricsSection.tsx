/* eslint-disable react-hooks/error-boundaries */
import {
  getArchetypeMarginHistogram,
  getArchetypeSnapSummary,
  getAvgMetrics,
  getDailyTokenUsage,
  getRerankEnabledSummary,
} from "../../../lib/pgpt-insights/cached";

import { formatCompactNumber, formatDurationMs } from "../format";
import { DataTable } from "../table/DataTable";
import { StatusBadge } from "../table/StatusBadge";
import { TableShell } from "../table/TableShell";

import { SectionError } from "./SectionError";

export async function MetricsSection({
  envFilter,
  daysFilter,
  tableDensityClass,
  rerankFilter,
  snappedFilter,
  marginLt,
}: {
  envFilter?: string;
  daysFilter?: number;
  tableDensityClass: string;
  rerankFilter?: string;
  snappedFilter?: string;
  marginLt?: string;
}) {
  try {
    const parseMargin = (v?: string) => {
      if (!v || v === "any") return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n < 0) return 0;
      if (n > 1) return 1;
      return n;
    };

    const marginLtNum = parseMargin(marginLt);

    const [dailyTokenUsage, avgMetrics, snapSummary, rerankSummary, marginBuckets] = await Promise.all([
      getDailyTokenUsage(envFilter, daysFilter),
      getAvgMetrics(envFilter, daysFilter),
      getArchetypeSnapSummary(envFilter, daysFilter, rerankFilter, snappedFilter, marginLtNum),
      getRerankEnabledSummary(envFilter, daysFilter, rerankFilter, snappedFilter, marginLtNum),
      getArchetypeMarginHistogram(envFilter, daysFilter, rerankFilter, snappedFilter, marginLtNum),
    ]);

    const totalPromptTokens = dailyTokenUsage.reduce((sum, row) => sum + row.total_prompt_tokens, 0);
    const totalCompletionTokens = dailyTokenUsage.reduce((sum, row) => sum + row.total_completion_tokens, 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;

    const latencyRollup = avgMetrics.reduce(
      (acc, row) => {
        if (row.avg_latency_ms === null || Number.isNaN(row.avg_latency_ms) || row.request_count <= 0) return acc;
        acc.numerator += row.avg_latency_ms * row.request_count;
        acc.denominator += row.request_count;
        return acc;
      },
      { numerator: 0, denominator: 0 },
    );
    const avgLatencyMs = latencyRollup.denominator > 0 ? latencyRollup.numerator / latencyRollup.denominator : null;

    const snapDenom = (snapSummary?.snapped_count ?? 0) + (snapSummary?.mixed_count ?? 0);
    const snapPct = snapDenom > 0 ? Math.round(((snapSummary?.snapped_count ?? 0) / snapDenom) * 100) : null;

    const rerankDenom = (rerankSummary?.rerank_on_count ?? 0) + (rerankSummary?.rerank_off_count ?? 0);
    const rerankPct = rerankDenom > 0 ? Math.round(((rerankSummary?.rerank_on_count ?? 0) / rerankDenom) * 100) : null;

    const maxBucketHits = marginBuckets.reduce((m, b) => Math.max(m, b.hits), 0) || 0;

    return (
      <TableShell
        id="metrics"
        title="Metrics (Tokens & Latency)"
        description="Cost and responsiveness signals."
        collapsible
        defaultOpen
        actions={
          <>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
              latency {formatDurationMs(avgLatencyMs)}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
              tokens {formatCompactNumber(totalTokens)}
            </span>
          </>
        }
        contentClassName="space-y-3"
      >
        {dailyTokenUsage.length === 0 ? (
          <p className="text-xs text-muted-foreground">No token usage data for the current filters.</p>
        ) : (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Daily token usage</h3>
            <DataTable
              headers={[
                { key: "day", label: "day" },
                { key: "env", label: "env" },
                { key: "endpoint", label: "endpoint" },
                { key: "model", label: "model" },
                { key: "prompt", label: "prompt tokens", align: "right" },
                { key: "completion", label: "completion tokens", align: "right" },
                { key: "requests", label: "requests", align: "right" },
              ]}
              colgroup={
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[110px]" />
                  <col className="w-[160px]" />
                  <col className="w-[260px]" />
                  <col className="w-[170px]" />
                  <col className="w-[190px]" />
                  <col className="w-[140px]" />
                </colgroup>
              }
              minWidth="min-w-[1120px]"
              tableDensityClass={tableDensityClass}
            >
              {dailyTokenUsage.map((row, idx) => (
                <tr key={`${row.day}-${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                  <td>{String(row.day)}</td>
                  <td>
                    <StatusBadge type="env" value={row.env} />
                  </td>
                  <td>
                    <StatusBadge type="endpoint" value={row.endpoint} />
                  </td>
                  <td>{row.model ?? "(unknown)"}</td>
                  <td className="text-right tabular-nums">{row.total_prompt_tokens}</td>
                  <td className="text-right tabular-nums">{row.total_completion_tokens}</td>
                  <td className="text-right tabular-nums">{row.request_count}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {avgMetrics.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Average tokens &amp; latency per request</h3>
            <DataTable
              headers={[
                { key: "env", label: "env" },
                { key: "endpoint", label: "endpoint" },
                { key: "model", label: "model" },
                { key: "avg-prompt", label: "avg prompt tokens", align: "right" },
                { key: "avg-completion", label: "avg completion tokens", align: "right" },
                { key: "avg-latency", label: "avg latency (ms)", align: "right" },
                { key: "requests", label: "requests", align: "right" },
              ]}
              colgroup={
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[160px]" />
                  <col className="w-[260px]" />
                  <col className="w-[190px]" />
                  <col className="w-[210px]" />
                  <col className="w-[190px]" />
                  <col className="w-[140px]" />
                </colgroup>
              }
              minWidth="min-w-[1120px]"
              tableDensityClass={tableDensityClass}
            >
              {avgMetrics.map((row, idx) => (
                <tr key={`${row.env}-${row.endpoint}-${row.model ?? "unknown"}-${idx}`}>
                  <td>
                    <StatusBadge type="env" value={row.env} />
                  </td>
                  <td>
                    <StatusBadge type="endpoint" value={row.endpoint} />
                  </td>
                  <td>{row.model ?? "(unknown)"}</td>
                  <td className="text-right tabular-nums">
                    {row.avg_prompt_tokens === null ? "—" : row.avg_prompt_tokens.toFixed(1)}
                  </td>
                  <td className="text-right tabular-nums">
                    {row.avg_completion_tokens === null ? "—" : row.avg_completion_tokens.toFixed(1)}
                  </td>
                  <td className="text-right tabular-nums">
                    {row.avg_latency_ms === null ? "—" : Math.round(row.avg_latency_ms)}
                  </td>
                  <td className="text-right tabular-nums">{row.request_count}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold">Tuning (Archetype + Retrieval)</h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="font-semibold text-foreground">Archetype snapped vs mixed</div>
                <div className="text-muted-foreground">
                  {snapPct !== null ? `${snapPct}% snapped` : "—"}
                </div>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full border border-border bg-muted/30">
                <div
                  className="bg-blue-500/70"
                  style={{ width: `${snapDenom > 0 ? ((snapSummary?.snapped_count ?? 0) / snapDenom) * 100 : 0}%` }}
                  aria-label="snapped share"
                />
                <div
                  className="bg-amber-500/60"
                  style={{ width: `${snapDenom > 0 ? ((snapSummary?.mixed_count ?? 0) / snapDenom) * 100 : 0}%` }}
                  aria-label="mixed share"
                />
              </div>
              <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                <span>snapped {snapSummary?.snapped_count ?? 0}</span>
                <span>mixed {snapSummary?.mixed_count ?? 0}</span>
                <span>unknown {snapSummary?.unknown_count ?? 0}</span>
                <span>total {snapSummary?.total ?? 0}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="font-semibold text-foreground">Rerank enabled</div>
                <div className="text-muted-foreground">{rerankPct !== null ? `${rerankPct}% on` : "—"}</div>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full border border-border bg-muted/30">
                <div
                  className="bg-emerald-500/70"
                  style={{
                    width: `${rerankDenom > 0 ? ((rerankSummary?.rerank_on_count ?? 0) / rerankDenom) * 100 : 0}%`,
                  }}
                  aria-label="rerank on share"
                />
                <div
                  className="bg-slate-500/60"
                  style={{
                    width: `${rerankDenom > 0 ? ((rerankSummary?.rerank_off_count ?? 0) / rerankDenom) * 100 : 0}%`,
                  }}
                  aria-label="rerank off share"
                />
              </div>
              <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                <span>on {rerankSummary?.rerank_on_count ?? 0}</span>
                <span>off {rerankSummary?.rerank_off_count ?? 0}</span>
                <span>unknown {rerankSummary?.unknown_count ?? 0}</span>
                <span>total {rerankSummary?.total ?? 0}</span>
                {rerankSummary?.avg_candidate_limit !== null ? (
                  <span>avg candidateLimit {Math.round(rerankSummary.avg_candidate_limit)}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="font-semibold text-foreground">Archetype margin histogram</div>
              <div className="text-muted-foreground text-[11px]">
                Uses margin when present, otherwise legacy confidence.
              </div>
            </div>

            {marginBuckets.length === 0 ? (
              <div className="text-xs text-muted-foreground">No margin data for the current filters.</div>
            ) : (
              <div className="space-y-1">
                {marginBuckets.map((b) => (
                  <div key={b.bucket_order} className="flex items-center gap-3 text-xs">
                    <div className="w-20 text-muted-foreground">{b.bucket_label}</div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full border border-border bg-muted/20">
                        <div
                          className="h-3 rounded-full bg-foreground/60"
                          style={{
                            width: `${maxBucketHits > 0 ? (b.hits / maxBucketHits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right tabular-nums text-muted-foreground">{b.hits}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="metrics" title="Metrics (Tokens & Latency)" error={error} />;
  }
}
