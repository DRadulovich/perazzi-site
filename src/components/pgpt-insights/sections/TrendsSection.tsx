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

type TrendsSectionProps = Readonly<{
  envFilter?: string;
  endpointFilter?: string;
  daysFilter?: number;
  rerankFilter?: string;
  snappedFilter?: string;
  marginLt?: string;
  tableDensityClass: string;
}>;

type TrendsFilters = Omit<TrendsSectionProps, "tableDensityClass">;

type DailyTrendRow = Awaited<ReturnType<typeof getDailyTrends>>[number];
type DailyLowScoreRow = Awaited<ReturnType<typeof getDailyLowScoreRate>>[number];
type DailySnapRateRow = Awaited<ReturnType<typeof getDailyArchetypeSnapRate>>[number];
type DailyRerankRateRow = Awaited<ReturnType<typeof getDailyRerankEnabledRate>>[number];

type TrendRow = {
  day: DailyTrendRow["day"];
  requests: DailyTrendRow["request_count"];
  tokens: number;
  latency_ms: DailyTrendRow["avg_latency_ms"];
  low_rate_pct: number | null;
  snap_rate_pct: number | null;
  rerank_rate_pct: number | null;
};

type HeatDatum = {
  label: string;
  value: number | null;
};

type Delta = {
  deltaLabel: string;
  tone: "positive" | "negative";
  diff: number;
  pctDiff: number | null;
} | null;

type TrendTone = "positive" | "negative" | "default";

type TrendsViewModel = {
  rows: TrendRow[];
  requestsSeries: number[];
  tokensSeries: number[];
  latencySeries: Array<number | null>;
  lowRateSeries: Array<number | null>;
  last?: TrendRow;
  requestsDelta: Delta;
  tokensDelta: Delta;
  latencyDelta: Delta;
  lowRateDelta: Delta;
  heatLow: HeatDatum[];
  heatTuning: HeatDatum[];
  rerankHeat: HeatDatum[];
  histogramValues: number[];
  tuningApplies: boolean;
};

type TrendsContentProps = TrendsViewModel & Pick<TrendsSectionProps, "tableDensityClass">;

function pct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function calcDelta(series: Array<number | null | undefined>): Delta {
  const finite = series.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (finite.length < 2) return null;

  const last = finite.at(-1);
  const prev = finite.at(-2);
  if (last === undefined || prev === undefined) return null;

  const diff = last - prev;
  const pctDiff = prev === 0 ? null : (diff / prev) * 100;
  const tone: "positive" | "negative" = diff >= 0 ? "positive" : "negative";
  const diffPrefix = diff > 0 ? "+" : "";
  const deltaLabel =
    pctDiff === null ? `${diffPrefix}${diff.toFixed(1)}` : `${diffPrefix}${pctDiff.toFixed(1)}%`;
  return { deltaLabel, tone, diff, pctDiff };
}

function shortDayLabel(day: string | number | Date) {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return String(day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clampDays(daysFilter?: number) {
  if (typeof daysFilter !== "number" || !Number.isFinite(daysFilter)) return 90;
  return Math.min(Math.max(daysFilter, 7), 90);
}

function parseMargin(value?: string) {
  if (!value || value === "any") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function percentFromCounts(count: number, total: number) {
  if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) return null;
  return (count / total) * 100;
}

function buildTrendRows(
  trends: DailyTrendRow[],
  lowScore: DailyLowScoreRow[],
  snapDaily: DailySnapRateRow[],
  rerankDaily: DailyRerankRateRow[],
): TrendRow[] {
  const lowMap = new Map(lowScore.map((r) => [r.day, r]));
  const snapMap = new Map(snapDaily.map((r) => [r.day, r]));
  const rerankMap = new Map(rerankDaily.map((r) => [r.day, r]));

  return trends.map((t) => {
    const low = lowMap.get(t.day);
    const lowRate = low ? percentFromCounts(low.low_count, low.total_scored) : null;
    const snap = snapMap.get(t.day);
    const snapRate = snap ? percentFromCounts(snap.snapped_count, snap.total_classified) : null;
    const rerank = rerankMap.get(t.day);
    const rerankRate = rerank ? percentFromCounts(rerank.rerank_on_count, rerank.total_flagged) : null;

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
}

function buildHeatData(rows: TrendRow[], valueSelector: (row: TrendRow) => number | null): HeatDatum[] {
  return rows.map((row) => ({
    label: shortDayLabel(row.day),
    value: valueSelector(row) ?? null,
  }));
}

function getDeltaTone(delta: Delta, lowerIsBetter = false): TrendTone {
  if (!delta) return "default";
  if (lowerIsBetter) {
    return delta.diff <= 0 ? "positive" : "negative";
  }
  return delta.diff >= 0 ? "positive" : "negative";
}

async function loadTrendsViewModel({
  envFilter,
  endpointFilter,
  daysFilter,
  rerankFilter,
  snappedFilter,
  marginLt,
}: TrendsFilters): Promise<TrendsViewModel> {
  const capDays = clampDays(daysFilter);
  const tuningApplies = !endpointFilter || endpointFilter === "assistant" || endpointFilter === "all";
  const marginLtNum = parseMargin(marginLt);

  const snapDailyPromise = tuningApplies
    ? getDailyArchetypeSnapRate(envFilter, capDays, rerankFilter, snappedFilter, marginLtNum)
    : Promise.resolve<DailySnapRateRow[]>([]);
  const rerankDailyPromise = tuningApplies
    ? getDailyRerankEnabledRate(envFilter, capDays, rerankFilter, snappedFilter, marginLtNum)
    : Promise.resolve<DailyRerankRateRow[]>([]);

  const [trends, lowScore, snapDaily, rerankDaily] = await Promise.all([
    getDailyTrends(envFilter, endpointFilter, capDays),
    getDailyLowScoreRate(envFilter, capDays, LOW_SCORE_THRESHOLD),
    snapDailyPromise,
    rerankDailyPromise,
  ]);

  const rows = buildTrendRows(trends, lowScore, snapDaily, rerankDaily);
  const requestsSeries = rows.map((r) => r.requests);
  const tokensSeries = rows.map((r) => r.tokens);
  const latencySeries = rows.map((r) => r.latency_ms);
  const lowRateSeries = rows.map((r) => r.low_rate_pct);

  const last = rows.at(-1);
  const requestsDelta = calcDelta(requestsSeries);
  const tokensDelta = calcDelta(tokensSeries);
  const latencyDelta = calcDelta(latencySeries);
  const lowRateDelta = calcDelta(lowRateSeries);

  const recentRows = rows.slice(-60);
  const heatLow = buildHeatData(recentRows, (row) => row.low_rate_pct);
  const heatTuning = tuningApplies ? buildHeatData(recentRows, (row) => row.snap_rate_pct) : [];
  const rerankHeat = tuningApplies ? buildHeatData(recentRows, (row) => row.rerank_rate_pct) : [];

  const histogramValues = lowRateSeries.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  return {
    rows,
    requestsSeries,
    tokensSeries,
    latencySeries,
    lowRateSeries,
    last,
    requestsDelta,
    tokensDelta,
    latencyDelta,
    lowRateDelta,
    heatLow,
    heatTuning,
    rerankHeat,
    histogramValues,
    tuningApplies,
  };
}

function TrendsContent({
  rows,
  requestsSeries,
  tokensSeries,
  latencySeries,
  lowRateSeries,
  last,
  requestsDelta,
  tokensDelta,
  latencyDelta,
  lowRateDelta,
  heatLow,
  heatTuning,
  rerankHeat,
  histogramValues,
  tuningApplies,
  tableDensityClass,
}: TrendsContentProps) {
  if (rows.length === 0) {
    return <NoDataCard title="Trends" hint="Adjust filters" />;
  }

  const latencyTone = getDeltaTone(latencyDelta, true);
  const lowRateTone = getDeltaTone(lowRateDelta, true);

  return (
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
          tone={latencyTone}
          trend={latencySeries}
          subtitle="Lower is better"
        />
        <KpiCard
          title="Low-score rate/day (assistant)"
          value={last ? pct(last.low_rate_pct) : "—"}
          deltaLabel={lowRateDelta?.deltaLabel ?? null}
          tone={lowRateTone}
          trend={lowRateSeries}
          subtitle={`maxScore < ${LOW_SCORE_THRESHOLD}`}
        />
      </div>

      <DualAxisChart
        data={rows.map((row) => ({
          label: shortDayLabel(row.day),
          bar: row.requests,
          line: row.latency_ms ?? null,
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
              data={rerankHeat}
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
            <col className="w-40" />
            <col className="w-40" />
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
          {rows.map((row) => (
            <tr key={row.day}>
              <td>{String(row.day)}</td>
              <td className="text-right tabular-nums">{formatCompactNumber(row.requests)}</td>
              <td className="text-right tabular-nums">{formatCompactNumber(row.tokens)}</td>
              <td className="text-right tabular-nums">{formatDurationMs(row.latency_ms)}</td>
              <td className="text-right tabular-nums">{pct(row.low_rate_pct)}</td>
              <td className="text-right tabular-nums">
                {tuningApplies ? pct(row.snap_rate_pct ?? null) : "—"}
              </td>
              <td className="text-right tabular-nums">
                {tuningApplies ? pct(row.rerank_rate_pct ?? null) : "—"}
              </td>
            </tr>
          ))}
        </RowLimiter>
      </DataTable>
    </>
  );
}

export async function TrendsSection({
  envFilter,
  endpointFilter,
  daysFilter,
  rerankFilter,
  snappedFilter,
  marginLt,
  tableDensityClass,
}: TrendsSectionProps) {
  let viewModel: TrendsViewModel | null = null;
  let loadError: unknown;

  try {
    viewModel = await loadTrendsViewModel({
      envFilter,
      endpointFilter,
      daysFilter,
      rerankFilter,
      snappedFilter,
      marginLt,
    });
  } catch (error) {
    loadError = error;
  }

  if (!viewModel) {
    return (
      <SectionError
        id="trends"
        title="Trends"
        error={loadError ?? new Error("Unable to load trends data.")}
      />
    );
  }

  return (
    <TableShell
      id="trends"
      title="Trends"
      description="Lightweight charts for quick anomaly spotting. Table below is the fallback + exact values."
      contentClassName="space-y-4"
    >
      <TrendsContent {...viewModel} tableDensityClass={tableDensityClass} />
    </TableShell>
  );
}
