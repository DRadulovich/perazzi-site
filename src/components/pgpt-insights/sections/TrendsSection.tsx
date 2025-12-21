import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import {
  getDailyArchetypeSnapRate,
  getDailyLowScoreRate,
  getDailyRerankEnabledRate,
  getDailyTrends,
} from "../../../lib/pgpt-insights/cached";

import { DualAxisChart } from "../charts/DualAxisChart";
import { NoDataCard } from "@/components/pgpt-insights/common/NoDataCard";
import { HeatStrip } from "../charts/HeatStrip";
import { Histogram } from "../charts/Histogram";
import { KpiCard } from "../charts/KpiCard";
import { formatCompactNumber, formatDurationMs } from "../format";
import { DataTable } from "../table/DataTable";
import { RowLimiter } from "../table/RowLimiter";
import { TableShell } from "../table/TableShell";
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
  tableDensityClass,
}: {
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  rerankFilter?: string;
  snappedFilter?: string;
  marginLt?: string;
  tableDensityClass: string;
}) {
  type DailySnapRateRow = Awaited<ReturnType<typeof getDailyArchetypeSnapRate>>[number];
  type DailyRerankRateRow = Awaited<ReturnType<typeof getDailyRerankEnabledRate>>[number];

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
        : Promise.resolve<DailySnapRateRow[]>([]),
      tuningApplies
        ? getDailyRerankEnabledRate(envFilter, capDays, rerankFilter, snappedFilter, marginLtNum)
        : Promise.resolve<DailyRerankRateRow[]>([]),
    ]);

    const lowMap = new Map(lowScore.map((r) => [r.day, r]));
    const snapMap = new Map(snapDaily.map((r) => [r.day, r]));
    const rerankMap = new Map(rerankDaily.map((r) => [r.day, r]));

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

    const last = rows[rows.length - 1];

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
      <TableShell
        id="trends"
        title="Trends"
        description="Lightweight charts for quick anomaly spotting. Table below is the fallback + exact values."
        contentClassName="space-y-4"
      >
        {rows.length === 0 ? (
          <NoDataCard title="Trends" hint="Adjust filters" />
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

            <DataTable
              headers={[
                { key: "day", label: "day" },
                { key: "requests", label: "requests", align: "right" },
                { key: "tokens", label: "tokens", align: "right" },
                { key: "latency", label: "avg latency", align: "right" },
                { key: "low-rate", label: "low-score rate", align: "right" },
                { key: "snapped-rate", label: "snapped rate", align: "right" },
                { key: "rerank-rate", label: "rerank on rate", align: "right" },
              ]}
              colgroup={
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                </colgroup>
              }
              minWidth="min-w-[880px]"
              tableDensityClass={tableDensityClass}
            >
              <RowLimiter colSpan={7} defaultVisible={14} label="days">
                {rows.map((r) => (
                  <tr key={r.day}>
                    <td>{String(r.day)}</td>
                    <td className="text-right tabular-nums">{formatCompactNumber(r.requests)}</td>
                    <td className="text-right tabular-nums">{formatCompactNumber(r.tokens)}</td>
                    <td className="text-right tabular-nums">{formatDurationMs(r.latency_ms)}</td>
                    <td className="text-right tabular-nums">{pct(r.low_rate_pct)}</td>
                    <td className="text-right tabular-nums">
                      {tuningApplies ? pct(r.snap_rate_pct ?? null) : "—"}
                    </td>
                    <td className="text-right tabular-nums">
                      {tuningApplies ? pct(r.rerank_rate_pct ?? null) : "—"}
                    </td>
                  </tr>
                ))}
              </RowLimiter>
            </DataTable>
          </>
        )}
      </TableShell>
    );
  } catch (error) {
    return <SectionError id="trends" title="Trends" error={error} />;
  }
}
