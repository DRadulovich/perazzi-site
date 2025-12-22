import { cache } from "react";

import type { BoolFilter } from "./log-filters";
import {
  fetchArchetypeIntentStats,
  fetchArchetypeSummary,
  fetchAvgLatencyMsWindow,
  fetchAvgMetrics,
  fetchDailyTokenUsage,
  fetchGuardrailBlockedCountWindow,
  fetchGuardrailByArchetype,
  fetchGuardrailStats,
  fetchDataHealth,
  fetchLowScoreLogs,
  fetchOpenQaFlagCount,
  fetchRagSummary,
  fetchRagSummaryWindow,
  fetchRecentGuardrailBlocks,
  fetchTopChunks,
  fetchDailyTrends,
  fetchDailyLowScoreRate,
  fetchAssistantRequestCountWindow,
  fetchArchetypeSnapSummary,
  fetchRerankEnabledSummary,
  fetchArchetypeMarginHistogram,
  fetchDailyArchetypeSnapRate,
  fetchDailyRerankEnabledRate,
  fetchArchetypeDailySeries,
  fetchTriggerTermWeeks,
  fetchTriggerTermsForWeek,
  fetchTemplateUsageHeatmap,
  fetchLowMarginSessions,
  fetchArchetypeMarginSummary,
  fetchArchetypeVariantSplit,
} from "./queries";

const toBoolFilter = (value?: string): BoolFilter | undefined => {
  if (value === "true" || value === "false" || value === "any") return value;
  return undefined;
};

export const getRagSummary = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchRagSummary(envFilter, daysFilter),
);

export const getRagSummaryWindow = cache(
  async (envFilter: string | undefined, threshold: number, startDaysAgo: number, endDaysAgo: number) =>
    fetchRagSummaryWindow(envFilter, threshold, startDaysAgo, endDaysAgo),
);

export const getGuardrailStats = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchGuardrailStats(envFilter, daysFilter),
);

export const getGuardrailBlockedCountWindow = cache(
  async (envFilter: string | undefined, startDaysAgo: number, endDaysAgo: number) =>
    fetchGuardrailBlockedCountWindow(envFilter, startDaysAgo, endDaysAgo),
);

export const getAvgMetrics = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchAvgMetrics(envFilter, daysFilter),
);

export const getAvgLatencyMsWindow = cache(
  async (envFilter: string | undefined, startDaysAgo: number, endDaysAgo: number) =>
    fetchAvgLatencyMsWindow(envFilter, startDaysAgo, endDaysAgo),
);

export const getDailyTokenUsage = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchDailyTokenUsage(envFilter, daysFilter),
);

export const getLowScoreLogs = cache(
  async (envFilter: string | undefined, threshold: number, daysFilter: number | undefined) =>
    fetchLowScoreLogs(envFilter, threshold, daysFilter),
);

export const getTopChunks = cache(
  async (envFilter: string | undefined, limit: number, daysFilter: number | undefined) =>
    fetchTopChunks(envFilter, limit, daysFilter),
);

export const getGuardrailByArchetype = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchGuardrailByArchetype(envFilter, daysFilter),
);

export const getRecentGuardrailBlocks = cache(
  async (envFilter: string | undefined, limit: number, daysFilter: number | undefined) =>
    fetchRecentGuardrailBlocks(envFilter, limit, daysFilter),
);

export const getArchetypeIntentStats = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchArchetypeIntentStats(envFilter, daysFilter),
);

export const getArchetypeSummary = cache(async (envFilter: string | undefined, daysFilter: number | undefined) =>
  fetchArchetypeSummary(envFilter, daysFilter),
);

export const getOpenQaFlagCount = cache(async () => fetchOpenQaFlagCount());

export const getDataHealth = cache(async (envFilter: string | undefined) => fetchDataHealth(envFilter));

export const getDailyTrends = cache(
  async (envFilter: string | undefined, endpointFilter: string | undefined, days: number) =>
    fetchDailyTrends({ envFilter, endpointFilter, days }),
);

export const getDailyLowScoreRate = cache(async (envFilter: string | undefined, days: number, threshold: number) =>
  fetchDailyLowScoreRate({ envFilter, days, threshold }),
);

export const getAssistantRequestCountWindow = cache(
  async (envFilter: string | undefined, startDaysAgo: number, endDaysAgo: number) =>
    fetchAssistantRequestCountWindow(envFilter, startDaysAgo, endDaysAgo),
);

export const getArchetypeSnapSummary = cache(
  async (
    envFilter: string | undefined,
    daysFilter: number | undefined,
    rerank?: string,
    snapped?: string,
    marginLt?: number | null,
  ) =>
    fetchArchetypeSnapSummary(
      envFilter,
      daysFilter,
      toBoolFilter(rerank),
      toBoolFilter(snapped),
      marginLt,
    ),
);

export const getRerankEnabledSummary = cache(
  async (
    envFilter: string | undefined,
    daysFilter: number | undefined,
    rerank?: string,
    snapped?: string,
    marginLt?: number | null,
  ) =>
    fetchRerankEnabledSummary(
      envFilter,
      daysFilter,
      toBoolFilter(rerank),
      toBoolFilter(snapped),
      marginLt,
    ),
);

export const getArchetypeMarginHistogram = cache(
  async (
    envFilter: string | undefined,
    daysFilter: number | undefined,
    rerank?: string,
    snapped?: string,
    marginLt?: number | null,
  ) =>
    fetchArchetypeMarginHistogram(
      envFilter,
      daysFilter,
      toBoolFilter(rerank),
      toBoolFilter(snapped),
      marginLt,
    ),
);

export const getDailyArchetypeSnapRate = cache(
  async (envFilter: string | undefined, days: number, rerank?: string, snapped?: string, marginLt?: number | null) =>
    fetchDailyArchetypeSnapRate({
      envFilter,
      days,
      rerank: toBoolFilter(rerank),
      snapped: toBoolFilter(snapped),
      marginLt,
    }),
);

export const getDailyRerankEnabledRate = cache(
  async (envFilter: string | undefined, days: number, rerank?: string, snapped?: string, marginLt?: number | null) =>
    fetchDailyRerankEnabledRate({
      envFilter,
      days,
      rerank: toBoolFilter(rerank),
      snapped: toBoolFilter(snapped),
      marginLt,
    }),
);

export const getArchetypeDailySeries = cache(async (days: number) => fetchArchetypeDailySeries(days));

export const getArchetypeMarginSummary = cache(async (days: number) => fetchArchetypeMarginSummary(days));

export const getArchetypeVariantSplit = cache(async (days: number) => fetchArchetypeVariantSplit(days));

export const getTriggerTermWeeks = cache(async (limit?: number) => fetchTriggerTermWeeks(limit ?? 12));

export const getTriggerTermsForWeek = cache(async (week: string, limit?: number) =>
  fetchTriggerTermsForWeek(week, limit ?? 20),
);

export const getTemplateUsageHeatmap = cache(async (days: number) => fetchTemplateUsageHeatmap(days));

export const getLowMarginSessions = cache(
  async (days: number, marginThreshold?: number, minStreak?: number, limit?: number) =>
    fetchLowMarginSessions({
      days,
      marginThreshold,
      minStreak,
      limit,
    }),
);
