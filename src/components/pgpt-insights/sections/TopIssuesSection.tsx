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
import { SectionHeader } from "../SectionHeader";
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
      tone: "danger" | "warn" | "neutral";
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
            ? "danger"
            : "warn";

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
        const tone = needsAttention ? "warn" : "neutral";

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
            ? "warn"
            : "neutral";

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
      <section
        id="top-issues"
        className="rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/80 to-muted/20 shadow-lg"
      >
        <SectionHeader
          title="Top Issues"
          description="Signals compared to the prior window (counts + rates)."
          rightMeta={
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {comparisonEnabled ? `last ${daysFilter}d vs prior ${daysFilter}d` : "comparison unavailable"}
            </span>
          }
        />

        <div className="space-y-3 border-t border-border/80 bg-card/70 px-4 py-4 sm:px-6 sm:py-6">
          {!comparisonEnabled ? (
            <p className="text-xs text-muted-foreground">
              Set a bounded time window (e.g. 7/30/90 days) to see deltas vs the previous window.
            </p>
          ) : visible.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No obvious regressions vs the previous window for the current scope.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((issue) => {
                const stripe =
                  issue.tone === "danger"
                    ? "bg-red-500/70"
                    : issue.tone === "warn"
                      ? "bg-amber-500/80"
                      : "bg-border";
                const ring =
                  issue.tone === "danger"
                    ? "ring-red-500/15"
                    : issue.tone === "warn"
                      ? "ring-amber-500/15"
                      : "ring-border/60";

                return (
                  <div
                    key={issue.key}
                    className={`relative overflow-hidden rounded-xl border border-border bg-background/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ring}`}
                  >
                    <span className={`absolute left-0 top-0 h-full w-[4px] ${stripe}`} aria-hidden="true" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">{issue.title}</div>
                        <div className="text-xs text-foreground">{issue.nowLine}</div>
                        <div className="text-xs text-muted-foreground">{issue.deltaLine}</div>
                      </div>
                      <Link
                        href={issue.href}
                        className="text-xs text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                      >
                        View →
                      </Link>
                    </div>

                    <div className="mt-3 text-[11px] text-muted-foreground">{issue.whyLine}</div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <Link href={issue.examplesHref} className="text-blue-600 underline underline-offset-4">
                        View examples →
                      </Link>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Inspect</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    return <SectionError id="top-issues" title="Top Issues" error={error} />;
  }
}
