/* eslint-disable react-hooks/error-boundaries */
import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { getDailyLowScoreRate, getDailyTrends } from "../../../lib/pgpt-insights/cached";

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
}: {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
}) {
  try {
    const capDays = typeof daysFilter === "number" && Number.isFinite(daysFilter) ? Math.min(Math.max(daysFilter, 7), 90) : 90;

    const [trends, lowScore] = await Promise.all([
      getDailyTrends(envFilter, endpointFilter, capDays),
      getDailyLowScoreRate(envFilter, capDays, LOW_SCORE_THRESHOLD),
    ]);

    const lowMap = new Map(lowScore.map((r) => [r.day, r]));
    const rows = trends.map((t) => {
      const low = lowMap.get(t.day);
      const lowRate = low && low.total_scored > 0 ? (low.low_count / low.total_scored) * 100 : null;

      return {
        day: t.day,
        requests: t.request_count,
        tokens: t.total_prompt_tokens + t.total_completion_tokens,
        latency_ms: t.avg_latency_ms,
        low_rate_pct: lowRate,
      };
    });

    const requestsSeries = rows.map((r) => r.requests);
    const tokensSeries = rows.map((r) => r.tokens);
    const latencySeries = rows.map((r) => (r.latency_ms === null ? null : r.latency_ms));
    const lowRateSeries = rows.map((r) => r.low_rate_pct);

    const last = rows[rows.length - 1];

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
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[880px] table-fixed border-collapse text-xs">
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[200px]" />
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
