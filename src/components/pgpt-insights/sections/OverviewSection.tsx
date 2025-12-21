/* eslint-disable react-hooks/error-boundaries */
import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { getDailyLowScoreRate, getDailyTrends, getGuardrailStats, getRagSummary } from "../../../lib/pgpt-insights/cached";

import { MiniTrend } from "../charts/MiniTrend";
import { NoDataCard } from "@/components/pgpt-insights/common/NoDataCard";
import { formatCompactNumber, formatDurationMs, formatScore } from "../format";
import { SectionHeader } from "../SectionHeader";
import { SectionError } from "./SectionError";

export async function OverviewSection({
  envFilter,
  daysFilter,
  scopeSummary,
}: {
  envFilter?: string;
  daysFilter?: number;
  scopeSummary: string;
}) {
  try {
    const capDays =
      typeof daysFilter === "number" && Number.isFinite(daysFilter) ? Math.min(Math.max(daysFilter, 7), 90) : 90;

    const [ragSummary, guardrailStats, trends, lowScore] = await Promise.all([
      getRagSummary(envFilter, daysFilter),
      getGuardrailStats(envFilter, daysFilter),
      getDailyTrends(envFilter, undefined, capDays),
      getDailyLowScoreRate(envFilter, capDays, LOW_SCORE_THRESHOLD),
    ]);

    if (trends.length === 0) {
      return <NoDataCard title="Overview" hint="Adjust filters" />;
    }

    const totalRequests = trends.reduce((sum, r) => sum + r.request_count, 0);
    const totalPromptTokens = trends.reduce((sum, r) => sum + r.total_prompt_tokens, 0);
    const totalCompletionTokens = trends.reduce((sum, r) => sum + r.total_completion_tokens, 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const avgTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : null;

    const latencyRollup = trends.reduce(
      (acc, row) => {
        if (row.avg_latency_ms === null || Number.isNaN(row.avg_latency_ms) || row.request_count <= 0) return acc;
        acc.numerator += row.avg_latency_ms * row.request_count;
        acc.denominator += row.request_count;
        return acc;
      },
      { numerator: 0, denominator: 0 },
    );
    const avgLatencyMs = latencyRollup.denominator > 0 ? latencyRollup.numerator / latencyRollup.denominator : null;

    const guardrailBlockedCount = guardrailStats.reduce((sum, row) => sum + row.hits, 0);

    const requestsSeries = trends.map((r) => r.request_count);
    const tokensSeries = trends.map((r) => r.total_prompt_tokens + r.total_completion_tokens);
    const latencySeries = trends.map((r) => (r.avg_latency_ms === null ? null : r.avg_latency_ms));

    const lowMap = new Map(lowScore.map((r) => [r.day, r]));
    const lowRateSeries = trends.map((t) => {
      const low = lowMap.get(t.day);
      if (!low || low.total_scored <= 0) return null;
      return (low.low_count / low.total_scored) * 100;
    });

    return (
      <section
        id="overview"
        className="rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/80 to-muted/20 shadow-lg"
      >
        <SectionHeader
          title="Overview"
          description="High-level signals for the current scope."
          rightMeta={<span className="text-[11px] uppercase tracking-wide text-muted-foreground">{scopeSummary}</span>}
        />

        <div className="grid grid-cols-2 gap-3 border-t border-border/80 bg-card/70 px-4 py-4 sm:grid-cols-3 sm:px-6 sm:py-6 lg:grid-cols-6">
          <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Requests</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(totalRequests)}</div>
            <div className="mt-1 text-xs text-muted-foreground">in window</div>
            <div className="mt-auto text-muted-foreground">
              <MiniTrend values={requestsSeries} title="Requests per day" height={72} />
            </div>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tokens</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(totalTokens)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {avgTokensPerRequest === null ? "—" : `~${Math.round(avgTokensPerRequest)} / req`}
            </div>
            <div className="mt-auto text-muted-foreground">
              <MiniTrend values={tokensSeries} title="Tokens per day" height={72} />
            </div>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg latency</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatDurationMs(avgLatencyMs)}</div>
            <div className="mt-1 text-xs text-muted-foreground">rolling</div>
            <div className="mt-auto text-muted-foreground">
              <MiniTrend values={latencySeries} title="Latency per day" height={72} />
            </div>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Retrieval avg</div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {ragSummary ? formatScore(ragSummary.avg_max_score) : "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">assistant maxScore</div>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Low-score</div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {ragSummary ? formatCompactNumber(ragSummary.low_count) : "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{`< ${LOW_SCORE_THRESHOLD}`}</div>
            <div className="mt-auto text-muted-foreground">
              <MiniTrend values={lowRateSeries} title="Low-score rate per day (assistant)" height={72} />
            </div>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Guardrail blocks</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{formatCompactNumber(guardrailBlockedCount)}</div>
            <div className="mt-1 text-xs text-muted-foreground">assistant</div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return <SectionError id="overview" title="Overview" error={error} />;
  }
}
