/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";

import { LOW_SCORE_THRESHOLD } from "../../../lib/pgpt-insights/constants";
import { buildInsightsHref } from "../../../lib/pgpt-insights/href";
import {
  getAssistantRequestCountWindow,
  getAvgLatencyMsWindow,
  getGuardrailBlockedCountWindow,
  getRagSummary,
  getRagSummaryWindow,
} from "../../../lib/pgpt-insights/cached";

import { formatDeltaMs, formatDeltaPp, formatRate } from "../format";
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
};

const GUARDRAIL_WARN_RATE = 0.01;
const GUARDRAIL_ALERT_RATE = 0.03;
const GUARDRAIL_WARN_DELTA_PP = 0.5;
const GUARDRAIL_ALERT_DELTA_PP = 1.0;

const LOWSCORE_WARN_RATE = 0.12;
const LOWSCORE_WARN_DELTA_PP = 5.0;

const LATENCY_WARN_DELTA_MS = 150;

export async function TopIssuesSection({
  envFilter,
  daysFilter,
  resolvedSearchParams,
}: {
  envFilter?: string;
  daysFilter?: number;
  resolvedSearchParams: SearchParams;
}) {
  try {
    const comparisonEnabled = typeof daysFilter === "number" && Number.isFinite(daysFilter) && daysFilter > 0;

    const [ragSummary, prevRagSummary] = await Promise.all([
      getRagSummary(envFilter, daysFilter),
      comparisonEnabled ? getRagSummaryWindow(envFilter, LOW_SCORE_THRESHOLD, daysFilter * 2, daysFilter) : Promise.resolve(null),
    ]);

    const [blockedNow, blockedPrev, assistantNow, assistantPrev] = comparisonEnabled
      ? await Promise.all([
          getGuardrailBlockedCountWindow(envFilter, daysFilter, 0),
          getGuardrailBlockedCountWindow(envFilter, daysFilter * 2, daysFilter),
          getAssistantRequestCountWindow(envFilter, daysFilter, 0),
          getAssistantRequestCountWindow(envFilter, daysFilter * 2, daysFilter),
        ])
      : [0, 0, 0, 0];

    const [latNow, latPrev] = comparisonEnabled
      ? await Promise.all([
          getAvgLatencyMsWindow(envFilter, daysFilter, 0),
          getAvgLatencyMsWindow(envFilter, daysFilter * 2, daysFilter),
        ])
      : [null, null];

    const guardrailRateNow = assistantNow > 0 ? blockedNow / assistantNow : null;
    const guardrailRatePrev = assistantPrev > 0 ? blockedPrev / assistantPrev : null;
    const guardrailDeltaPp =
      guardrailRateNow !== null && guardrailRatePrev !== null ? (guardrailRateNow - guardrailRatePrev) * 100 : null;

    const lowRateNow = ragSummary && ragSummary.total > 0 ? ragSummary.low_count / ragSummary.total : null;
    const lowRatePrev = prevRagSummary && prevRagSummary.total > 0 ? prevRagSummary.low_count / prevRagSummary.total : null;
    const lowDeltaPp = lowRateNow !== null && lowRatePrev !== null ? (lowRateNow - lowRatePrev) * 100 : null;

    const latencyDeltaMs = latNow !== null && latPrev !== null ? latNow - latPrev : null;

    type Issue = {
      key: "guardrails" | "rag" | "latency";
      title: string;
      tone: string;
      nowLine: string;
      deltaLine: string;
      whyLine: string;
      href: string;
      examplesHref: string;
    };

    function examplesHref(issueKey: Issue["key"]) {
      const base = {
        env: resolvedSearchParams.env,
        days: resolvedSearchParams.days,
        density: resolvedSearchParams.density,
        view: resolvedSearchParams.view,
        page: "1",
        q: undefined,
        gr_status: undefined,
        gr_reason: undefined,
        low_conf: undefined,
        score: undefined,
        archetype: undefined,
        model: undefined,
        gateway: undefined,
        qa: undefined,
      };

      if (issueKey === "guardrails") {
        return buildInsightsHref({ ...base, endpoint: "assistant", gr_status: "blocked" }) + "#logs";
      }

      if (issueKey === "rag") {
        return buildInsightsHref({ ...base, endpoint: "assistant", score: "lt0.25" }) + "#logs";
      }

      return buildInsightsHref({ ...base, endpoint: resolvedSearchParams.endpoint ?? "all" }) + "#logs";
    }

    const issues: Issue[] = [];

    if (comparisonEnabled) {
      if (assistantNow > 0 && blockedNow > 0 && guardrailRateNow !== null) {
        const tone =
          guardrailRateNow >= GUARDRAIL_ALERT_RATE ||
          (guardrailDeltaPp !== null && guardrailDeltaPp >= GUARDRAIL_ALERT_DELTA_PP && blockedNow >= 5)
            ? "border-l-4 border-red-500/50 bg-red-500/5 dark:border-red-500/60 dark:bg-red-500/15"
            : "border-l-4 border-amber-500/50 bg-amber-500/5 dark:border-amber-500/60 dark:bg-amber-500/15";

        const nowLine = `${blockedNow} blocks (${formatRate(guardrailRateNow)})`;
        const deltaLine =
          guardrailDeltaPp === null ? "Δ —" : `Δ ${formatDeltaPp(guardrailDeltaPp)} vs prior ${daysFilter}d`;

        issues.push({
          key: "guardrails",
          title: "Guardrail blocks (assistant)",
          tone,
          nowLine,
          deltaLine,
          whyLine: `threshold: yellow ≥ ${(GUARDRAIL_WARN_RATE * 100).toFixed(0)}% or +${GUARDRAIL_WARN_DELTA_PP}pp · red ≥ ${(GUARDRAIL_ALERT_RATE * 100).toFixed(0)}% or +${GUARDRAIL_ALERT_DELTA_PP}pp`,
          href: "#guardrails",
          examplesHref: examplesHref("guardrails"),
        });
      }

      if (ragSummary && ragSummary.total > 0 && lowRateNow !== null) {
        const needsAttention = lowRateNow >= LOWSCORE_WARN_RATE || (lowDeltaPp !== null && lowDeltaPp >= LOWSCORE_WARN_DELTA_PP);
        const tone = needsAttention
          ? "border-l-4 border-yellow-500/50 bg-yellow-500/5 dark:border-yellow-500/60 dark:bg-yellow-500/15"
          : "border-l-4 border-border";

        const nowLine = `${ragSummary.low_count} low (${formatRate(lowRateNow)})`;
        const deltaLine =
          lowDeltaPp === null ? "Δ —" : `Δ ${formatDeltaPp(lowDeltaPp)} vs prior ${daysFilter}d`;

        issues.push({
          key: "rag",
          title: "Low-score retrieval (assistant)",
          tone,
          nowLine,
          deltaLine,
          whyLine: `threshold: yellow ≥ ${(LOWSCORE_WARN_RATE * 100).toFixed(0)}% or +${LOWSCORE_WARN_DELTA_PP.toFixed(0)}pp (maxScore < ${LOW_SCORE_THRESHOLD})`,
          href: "#rag",
          examplesHref: examplesHref("rag"),
        });
      }

      if (latNow !== null && latencyDeltaMs !== null) {
        const tone =
          latencyDeltaMs >= LATENCY_WARN_DELTA_MS
            ? "border-l-4 border-amber-500/50 bg-amber-500/5 dark:border-amber-500/60 dark:bg-amber-500/15"
            : "border-l-4 border-border";

        const nowLine = `~${Math.round(latNow)}ms avg`;
        const deltaLine = `Δ ${formatDeltaMs(latencyDeltaMs)} vs prior ${daysFilter}d`;
        issues.push({
          key: "latency",
          title: "Avg latency",
          tone,
          nowLine,
          deltaLine,
          whyLine: `threshold: yellow if +${LATENCY_WARN_DELTA_MS}ms vs prior window`,
          href: "#metrics",
          examplesHref: examplesHref("latency"),
        });
      }
    }

    const visible = issues.slice(0, 6);

    return (
      <section id="top-issues" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Top Issues</h2>
            <p className="text-xs text-muted-foreground">Signals compared to the prior window (counts + rates).</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {comparisonEnabled ? `last ${daysFilter}d vs prior ${daysFilter}d` : "comparison unavailable"}
          </p>
        </div>

        {!comparisonEnabled ? (
          <p className="text-xs text-muted-foreground">
            Set a bounded time window (e.g. 7/30/90 days) to see deltas vs the previous window.
          </p>
        ) : visible.length === 0 ? (
          <p className="text-xs text-muted-foreground">No obvious regressions vs the previous window for the current scope.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((issue) => (
              <div key={issue.key} className={`rounded-xl border border-border bg-background p-4 ${issue.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">{issue.title}</div>
                    <div className="text-xs text-muted-foreground">{issue.nowLine}</div>
                    <div className="text-xs text-muted-foreground">{issue.deltaLine}</div>
                  </div>
                  <Link href={issue.href} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
                    View →
                  </Link>
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground">{issue.whyLine}</div>

                <div className="mt-3">
                  <Link href={issue.examplesHref} className="text-xs text-blue-600 underline underline-offset-4">
                    View examples →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  } catch (error) {
    return <SectionError id="top-issues" title="Top Issues" error={error} />;
  }
}
