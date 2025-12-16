/* eslint-disable react-hooks/error-boundaries */
import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import {
  getDailyArchetypeSnapRate,
  getDailyLowScoreRate,
  getDailyRerankEnabledRate,
  getDailyTrends,
} from "../../../lib/pgpt-insights/cached";

import { Sparkline } from "../Sparkline";
import { formatCompactNumber, formatDurationMs } from "../format";
import { SectionError } from "./SectionError";

function pct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export async function TrendsSection({
  envFilter,
  endpointFilter,
  daysFilter,
  rerankFilter,
  snappedFilter,
  marginLt,
}: {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  rerankFilter?: string;
  snappedFilter?: string;
  marginLt?: string;
}) {
  try {
    const capDays = typeof daysFilter === "number" && Number.isFinite(daysFilter) ? Math.min(Math.max(daysFilter, 7), 90) : 90;

    const tuningApplies = !endpointFilter || endpointFilter === "assistant" || endpointFilter === "all";

    const parseMargin = (v?: string) => {
      if (!v || v === "any") return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n < 0) return 0;
      if (n > 1) return 1;
      return n;
    };

    const marginLtNum = parseMargin(marginLt);

    const [trends, lowScore, snapDaily, rerankDaily] = await Promise.all([
      getDailyTrends(envFilter, endpointFilter, capDays),
      getDailyLowScoreRate(envFilter, capDays, LOW_SCORE_THRESHOLD),
      tuningApplies
        ? getDailyArchetypeSnapRate(envFilter, capDays, rerankFilter, snappedFilter, marginLtNum)
        : Promise.resolve([]),
      tuningApplies
        ? getDailyRerankEnabledRate(envFilter, capDays, rerankFilter, snappedFilter, marginLtNum)
        : Promise.resolve([]),
    ]);

    const lowMap = new Map(lowScore.map((r) => [r.day, r]));
    const snapMap = new Map((snapDaily as any[]).map((r: any) => [r.day, r]));
    const rerankMap = new Map((rerankDaily as any[]).map((r: any) => [r.day, r]));

    const rows = trends.map((t) => {
      const low = lowMap.get(t.day);
      const lowRate = low && low.total_scored > 0 ? (low.low_count / low.total_scored) * 100 : null;
      const snap = snapMap.get(t.day);
      const snapRate = snap && snap.total_classified > 0 ? (snap.snapped_count / snap.total_classified) * 100 : null;
      const rerank = rerankMap.get(t.day);
      const rerankRate = rerank && rerank.total_flagged > 0 ? (rerank.rerank_on_count / rerank.total_flagged) * 100 : null;

      return {
        day: t.day,
        requests: t.request_count,
        tokens: t.total_prompt_tokens + t.total_completion_tokens,
        latency_ms: t.avg_latency_ms,
        low_rate_pct: lowRate,
        snap_rate_pct: snapRate,
        rerank_rate_pct: rerankRate,
      };
    });

    const requestsSeries = rows.map((r) => r.requests);
    const tokensSeries = rows.map((r) => r.tokens);
    const latencySeries = rows.map((r) => (r.latency_ms === null ? null : r.latency_ms));
    const lowRateSeries = rows.map((r) => r.low_rate_pct);
    const snapRateSeries = rows.map((r) => r.snap_rate_pct ?? null);
    const rerankRateSeries = rows.map((r) => r.rerank_rate_pct ?? null);

    const last = rows[rows.length - 1];
    const lastNonNull = (arr: Array<number | null>) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== null && arr[i] !== undefined) return arr[i];
      }
      return null;
    };

    return (
      <section id="trends" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Trends</h2>
          <p className="text-xs text-muted-foreground">
            Lightweight charts for quick anomaly spotting. Table below is the fallback + exact values.
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trend data available for the current scope.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-foreground">Requests/day</div>
                  <div className="text-xs text-muted-foreground">
                    latest: {last ? formatCompactNumber(last.requests) : "—"}
                  </div>
                </div>
                <div className="mt-3 text-muted-foreground">
                  <Sparkline values={requestsSeries} width={560} height={120} title="Requests per day" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-foreground">Tokens/day</div>
                  <div className="text-xs text-muted-foreground">
                    latest: {last ? formatCompactNumber(last.tokens) : "—"}
                  </div>
                </div>
                <div className="mt-3 text-muted-foreground">
                  <Sparkline values={tokensSeries} width={560} height={120} title="Tokens per day" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-foreground">Avg latency/day</div>
                  <div className="text-xs text-muted-foreground">
                    latest: {last ? formatDurationMs(last.latency_ms) : "—"}
                  </div>
                </div>
                <div className="mt-3 text-muted-foreground">
                  <Sparkline values={latencySeries} width={560} height={120} title="Average latency per day" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-foreground">Low-score rate/day (assistant)</div>
                  <div className="text-xs text-muted-foreground">
                    latest: {last ? pct(last.low_rate_pct) : "—"}
                  </div>
                </div>
                <div className="mt-3 text-muted-foreground">
                  <Sparkline values={lowRateSeries} width={560} height={120} title="Low-score rate per day (assistant)" />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  rate = % of assistant interactions with maxScore &lt; {LOW_SCORE_THRESHOLD} (among those with maxScore)
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-foreground">Archetype snapped rate/day (assistant)</div>
                  <div className="text-xs text-muted-foreground">
                    latest: {pct(lastNonNull(snapRateSeries))}
                  </div>
                </div>
                <div className="mt-3 text-muted-foreground">
                  {tuningApplies ? (
                    <Sparkline values={snapRateSeries} width={560} height={120} title="Archetype snapped rate per day" />
                  ) : (
                    <div className="text-[11px] text-muted-foreground">Tuning metrics apply to assistant endpoint only.</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-foreground">Rerank enabled rate/day (assistant)</div>
                  <div className="text-xs text-muted-foreground">
                    latest: {pct(lastNonNull(rerankRateSeries))}
                  </div>
                </div>
                <div className="mt-3 text-muted-foreground">
                  {tuningApplies ? (
                    <Sparkline values={rerankRateSeries} width={560} height={120} title="Rerank enabled rate per day" />
                  ) : (
                    <div className="text-[11px] text-muted-foreground">Tuning metrics apply to assistant endpoint only.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[880px] table-fixed border-collapse text-xs">
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                      day
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                      requests
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                      tokens
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                      avg latency
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                      low-score rate
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                      snapped rate
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-right font-medium text-muted-foreground backdrop-blur">
                      rerank on rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((r) => (
                    <tr key={r.day}>
                      <td className="px-3 py-2">{String(r.day)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCompactNumber(r.requests)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCompactNumber(r.tokens)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatDurationMs(r.latency_ms)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{pct(r.low_rate_pct)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {tuningApplies ? pct(r.snap_rate_pct ?? null) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {tuningApplies ? pct(r.rerank_rate_pct ?? null) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    );
  } catch (error) {
    return <SectionError id="trends" title="Trends" error={error} />;
  }
}
