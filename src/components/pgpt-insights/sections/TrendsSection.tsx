/* eslint-disable react-hooks/error-boundaries */
import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import {
  getDailyArchetypeSnapRate,
  getDailyLowScoreRate,
  getDailyRerankEnabledRate,
  getDailyTrends,
} from "../../../lib/pgpt-insights/cached";

import { DualAxisChart } from "../charts/DualAxisChart";
import { HeatStrip } from "../charts/HeatStrip";
import { Histogram } from "../charts/Histogram";
import { KpiCard } from "../charts/KpiCard";
import { formatCompactNumber, formatDurationMs } from "../format";
import { SectionError } from "./SectionError";

function pct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function calcDelta(series: Array<number | null | undefined>) {
  const finite = series.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (finite.length < 2) return null;

  const last = finite[finite.length - 1];
  const prev = finite[finite.length - 2];
  if (!Number.isFinite(last) || !Number.isFinite(prev)) return null;

  const diff = last - prev;
  const pctDiff = prev === 0 ? null : (diff / prev) * 100;
  const tone = diff >= 0 ? "positive" : "negative";
  const deltaLabel = pctDiff === null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` : `${diff > 0 ? "+" : ""}${pctDiff.toFixed(1)}%`;
  return { deltaLabel, tone: tone as "positive" | "negative", diff, pctDiff };
}

function shortDayLabel(day: string | number | Date) {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return String(day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

    const requestsDelta = calcDelta(requestsSeries);
    const tokensDelta = calcDelta(tokensSeries);
    const latencyDelta = calcDelta(latencySeries);
    const lowRateDelta = calcDelta(lowRateSeries);

    const heatLow = rows.slice(-60).map((r) => ({
      label: shortDayLabel(r.day),
      value: r.low_rate_pct ?? null,
    }));
    const heatTuning = tuningApplies
      ? rows.slice(-60).map((r) => ({
          label: shortDayLabel(r.day),
          value: r.snap_rate_pct ?? null,
        }))
      : [];

    const histogramValues = lowRateSeries.filter((v): v is number => typeof v === "number" && Number.isFinite(v));

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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Requests/day"
                value={last ? formatCompactNumber(last.requests) : "—"}
                deltaLabel={requestsDelta?.deltaLabel ?? null}
                tone={requestsDelta?.tone}
                trend={requestsSeries}
              />
              <KpiCard
                title="Tokens/day"
                value={last ? formatCompactNumber(last.tokens) : "—"}
                deltaLabel={tokensDelta?.deltaLabel ?? null}
                tone={tokensDelta?.tone}
                trend={tokensSeries}
              />
              <KpiCard
                title="Avg latency/day"
                value={last ? formatDurationMs(last.latency_ms) : "—"}
                deltaLabel={latencyDelta?.deltaLabel ?? null}
                tone={latencyDelta ? (latencyDelta.diff <= 0 ? "positive" : "negative") : "default"}
                trend={latencySeries}
                subtitle="Lower is better"
              />
              <KpiCard
                title="Low-score rate/day (assistant)"
                value={last ? pct(last.low_rate_pct) : "—"}
                deltaLabel={lowRateDelta?.deltaLabel ?? null}
                tone={lowRateDelta ? (lowRateDelta.diff <= 0 ? "positive" : "negative") : "default"}
                trend={lowRateSeries}
                subtitle={`maxScore < ${LOW_SCORE_THRESHOLD}`}
              />
            </div>

            <DualAxisChart
              data={rows.map((r) => ({
                label: shortDayLabel(r.day),
                bar: r.requests,
                line: r.latency_ms ?? null,
              }))}
              barLabel="Requests/day"
              lineLabel="Avg latency (ms)"
              className="mt-2"
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <HeatStrip
                title="Low-score rate by day"
                subtitle={`% assistant interactions below maxScore ${LOW_SCORE_THRESHOLD}`}
                data={heatLow}
                valueSuffix="%"
                invertColors
                className="lg:col-span-1"
              />

              {tuningApplies ? (
                <div className="grid gap-4 lg:col-span-1">
                  <HeatStrip
                    title="Archetype snapped rate"
                    subtitle="Assistant only"
                    data={heatTuning}
                    valueSuffix="%"
                  />
                  <HeatStrip
                    title="Rerank enabled rate"
                    subtitle="Assistant only"
                    data={rows.slice(-60).map((r) => ({
                      label: shortDayLabel(r.day),
                      value: r.rerank_rate_pct ?? null,
                    }))}
                    valueSuffix="%"
                  />
                </div>
              ) : (
                <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  Tuning metrics apply to assistant endpoint only.
                </div>
              )}

              <Histogram
                title="Low-score rate distribution"
                subtitle="Daily % of assistant interactions flagged as low-score"
                values={histogramValues}
                bins={[0, 5, 10, 20, 40]}
                formatType="percent"
                className="lg:col-span-1"
              />
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
