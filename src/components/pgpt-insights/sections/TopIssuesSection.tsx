/* eslint-disable react-hooks/error-boundaries */
import Link from "next/link";
import type { ReactNode } from "react";

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
import { NoDataCard } from "@/components/pgpt-insights/common/NoDataCard";
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

type TopIssuesSectionProps = Readonly<{
  envFilter?: string;
  daysFilter?: number;
  resolvedSearchParams: SearchParams;
}>;

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

const GUARDRAIL_WARN_RATE = 0.01;
const GUARDRAIL_ALERT_RATE = 0.03;
const GUARDRAIL_WARN_DELTA_PP = 0.5;
const GUARDRAIL_ALERT_DELTA_PP = 1;

const LOWSCORE_WARN_RATE = 0.12;
const LOWSCORE_WARN_DELTA_PP = 5;

const LATENCY_WARN_DELTA_MS = 150;
const MAX_VISIBLE_ISSUES = 6;

const TONE_STYLES: Record<Issue["tone"], { stripe: string; ring: string }> = {
  danger: { stripe: "bg-red-500/70", ring: "ring-red-500/15" },
  warn: { stripe: "bg-amber-500/80", ring: "ring-amber-500/15" },
  neutral: { stripe: "bg-border", ring: "ring-border/60" },
};

type GuardrailCounts = {
  blockedNow: number;
  blockedPrev: number;
  assistantNow: number;
  assistantPrev: number;
};

type RagSummary = NonNullable<Awaited<ReturnType<typeof getRagSummary>>>;

type IssuesGridProps = Readonly<{
  issues: Issue[];
}>;

const getComparisonDays = (daysFilter?: number) => {
  if (typeof daysFilter !== "number" || !Number.isFinite(daysFilter) || daysFilter <= 0) {
    return null;
  }

  return daysFilter;
};

const buildExamplesHref = (resolvedSearchParams: SearchParams, issueKey: Issue["key"]) => {
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
};

const buildGuardrailIssue = (
  counts: GuardrailCounts,
  daysFilter: number,
  resolvedSearchParams: SearchParams,
): Issue | null => {
  if (counts.assistantNow <= 0 || counts.blockedNow <= 0) {
    return null;
  }

  const guardrailRateNow = counts.blockedNow / counts.assistantNow;
  const guardrailRatePrev = counts.assistantPrev > 0 ? counts.blockedPrev / counts.assistantPrev : null;
  const guardrailDeltaPp = guardrailRatePrev === null ? null : (guardrailRateNow - guardrailRatePrev) * 100;

  const shouldAlert =
    guardrailRateNow >= GUARDRAIL_ALERT_RATE ||
    (guardrailDeltaPp !== null && guardrailDeltaPp >= GUARDRAIL_ALERT_DELTA_PP && counts.blockedNow >= 5);

  const nowLine = `${counts.blockedNow} blocks (${formatRate(guardrailRateNow)})`;
  const deltaLine =
    guardrailDeltaPp === null ? "Δ —" : `Δ ${formatDeltaPp(guardrailDeltaPp)} vs prior ${daysFilter}d`;

  return {
    key: "guardrails",
    title: "Guardrail blocks (assistant)",
    tone: shouldAlert ? "danger" : "warn",
    nowLine,
    deltaLine,
    whyLine: `threshold: yellow ≥ ${(GUARDRAIL_WARN_RATE * 100).toFixed(0)}% or +${GUARDRAIL_WARN_DELTA_PP}pp · red ≥ ${(GUARDRAIL_ALERT_RATE * 100).toFixed(0)}% or +${GUARDRAIL_ALERT_DELTA_PP}pp`,
    href: "#guardrails",
    examplesHref: buildExamplesHref(resolvedSearchParams, "guardrails"),
  };
};

const buildRagIssue = (
  ragSummary: RagSummary | null,
  prevRagSummary: RagSummary | null,
  daysFilter: number,
  resolvedSearchParams: SearchParams,
): Issue | null => {
  if (!ragSummary || ragSummary.total <= 0) {
    return null;
  }

  const lowRateNow = ragSummary.low_count / ragSummary.total;
  const lowRatePrev = prevRagSummary && prevRagSummary.total > 0 ? prevRagSummary.low_count / prevRagSummary.total : null;
  const lowDeltaPp = lowRatePrev === null ? null : (lowRateNow - lowRatePrev) * 100;

  const needsAttention =
    lowRateNow >= LOWSCORE_WARN_RATE || (lowDeltaPp !== null && lowDeltaPp >= LOWSCORE_WARN_DELTA_PP);

  const nowLine = `${ragSummary.low_count} low (${formatRate(lowRateNow)})`;
  const deltaLine = lowDeltaPp === null ? "Δ —" : `Δ ${formatDeltaPp(lowDeltaPp)} vs prior ${daysFilter}d`;

  return {
    key: "rag",
    title: "Low-score retrieval (assistant)",
    tone: needsAttention ? "warn" : "neutral",
    nowLine,
    deltaLine,
    whyLine: `threshold: yellow ≥ ${(LOWSCORE_WARN_RATE * 100).toFixed(0)}% or +${LOWSCORE_WARN_DELTA_PP.toFixed(0)}pp (maxScore < ${LOW_SCORE_THRESHOLD})`,
    href: "#rag",
    examplesHref: buildExamplesHref(resolvedSearchParams, "rag"),
  };
};

const buildLatencyIssue = (
  latNow: number | null,
  latPrev: number | null,
  daysFilter: number,
  resolvedSearchParams: SearchParams,
): Issue | null => {
  if (latNow === null || latPrev === null) {
    return null;
  }

  const latencyDeltaMs = latNow - latPrev;

  return {
    key: "latency",
    title: "Avg latency",
    tone: latencyDeltaMs >= LATENCY_WARN_DELTA_MS ? "warn" : "neutral",
    nowLine: `~${Math.round(latNow)}ms avg`,
    deltaLine: `Δ ${formatDeltaMs(latencyDeltaMs)} vs prior ${daysFilter}d`,
    whyLine: `threshold: yellow if +${LATENCY_WARN_DELTA_MS}ms vs prior window`,
    href: "#metrics",
    examplesHref: buildExamplesHref(resolvedSearchParams, "latency"),
  };
};

const buildIssues = (params: {
  guardrailCounts: GuardrailCounts;
  ragSummary: RagSummary | null;
  prevRagSummary: RagSummary | null;
  latNow: number | null;
  latPrev: number | null;
  daysFilter: number;
  resolvedSearchParams: SearchParams;
}) => {
  const issues: Issue[] = [];

  const guardrailIssue = buildGuardrailIssue(params.guardrailCounts, params.daysFilter, params.resolvedSearchParams);
  if (guardrailIssue) {
    issues.push(guardrailIssue);
  }

  const ragIssue = buildRagIssue(params.ragSummary, params.prevRagSummary, params.daysFilter, params.resolvedSearchParams);
  if (ragIssue) {
    issues.push(ragIssue);
  }

  const latencyIssue = buildLatencyIssue(params.latNow, params.latPrev, params.daysFilter, params.resolvedSearchParams);
  if (latencyIssue) {
    issues.push(latencyIssue);
  }

  return issues;
};

function IssuesGrid({ issues }: IssuesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {issues.map((issue) => {
        const styles = TONE_STYLES[issue.tone];

        return (
          <div
            key={issue.key}
            className={`relative overflow-hidden rounded-xl border border-border bg-background/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.ring}`}
          >
            <span className={`absolute left-0 top-0 h-full w-[4px] ${styles.stripe}`} aria-hidden="true" />
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
  );
}

export async function TopIssuesSection({
  envFilter,
  daysFilter,
  resolvedSearchParams,
}: TopIssuesSectionProps) {
  try {
    const comparisonDays = getComparisonDays(daysFilter);
    const comparisonUnavailable = comparisonDays === null;
    const comparisonAvailable = !comparisonUnavailable;

    const [ragSummary, prevRagSummary] = await Promise.all([
      getRagSummary(envFilter, daysFilter),
      comparisonDays === null
        ? Promise.resolve(null)
        : getRagSummaryWindow(envFilter, LOW_SCORE_THRESHOLD, comparisonDays * 2, comparisonDays),
    ]);

    const [blockedNow, blockedPrev, assistantNow, assistantPrev] =
      comparisonDays === null
        ? [0, 0, 0, 0]
        : await Promise.all([
            getGuardrailBlockedCountWindow(envFilter, comparisonDays, 0),
            getGuardrailBlockedCountWindow(envFilter, comparisonDays * 2, comparisonDays),
            getAssistantRequestCountWindow(envFilter, comparisonDays, 0),
            getAssistantRequestCountWindow(envFilter, comparisonDays * 2, comparisonDays),
          ]);

    const [latNow, latPrev] =
      comparisonDays === null
        ? [null, null]
        : await Promise.all([
            getAvgLatencyMsWindow(envFilter, comparisonDays, 0),
            getAvgLatencyMsWindow(envFilter, comparisonDays * 2, comparisonDays),
          ]);

    const issues =
      comparisonDays === null
        ? []
        : buildIssues({
            guardrailCounts: { blockedNow, blockedPrev, assistantNow, assistantPrev },
            ragSummary,
            prevRagSummary,
            latNow,
            latPrev,
            daysFilter: comparisonDays,
            resolvedSearchParams,
          });

    const visible = issues.slice(0, MAX_VISIBLE_ISSUES);

    if (comparisonAvailable && issues.length === 0) {
      return (
        <NoDataCard title="Top Issues" hint="Adjust filters to see data." />
      );
    }

    let content: ReactNode;

    if (comparisonUnavailable) {
      content = (
        <p className="text-xs text-muted-foreground">
          Set a bounded time window (e.g. 7/30/90 days) to see deltas vs the previous window.
        </p>
      );
    } else if (visible.length === 0) {
      content = (
        <p className="text-xs text-muted-foreground">
          No obvious regressions vs the previous window for the current scope.
        </p>
      );
    } else {
      content = <IssuesGrid issues={visible} />;
    }

    return (
      <section
        id="top-issues"
        className="rounded-2xl border border-border/80 bg-linear-to-b from-card via-card/80 to-muted/20 shadow-lg"
      >
        <SectionHeader
          title="Top Issues"
          description="Signals compared to the prior window (counts + rates)."
          rightMeta={
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {comparisonAvailable ? `last ${daysFilter}d vs prior ${daysFilter}d` : "comparison unavailable"}
            </span>
          }
        />

        <div className="space-y-3 border-t border-border/80 bg-card/70 px-4 py-4 sm:px-6 sm:py-6">
          {content}
        </div>
      </section>
    );
  } catch (error) {
    return <SectionError id="top-issues" title="Top Issues" error={error} />;
  }
}
