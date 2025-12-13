import { cache } from "react";

import {
  fetchArchetypeIntentStats,
  fetchArchetypeSummary,
  fetchAvgLatencyMsWindow,
  fetchAvgMetrics,
  fetchDailyTokenUsage,
  fetchGuardrailBlockedCountWindow,
  fetchGuardrailByArchetype,
  fetchGuardrailStats,
  fetchLowScoreLogs,
  fetchOpenQaFlagCount,
  fetchRagSummary,
  fetchRagSummaryWindow,
  fetchRecentGuardrailBlocks,
  fetchTopChunks,
  fetchDailyTrends,
  fetchDailyLowScoreRate,
  fetchAssistantRequestCountWindow,
} from "./queries";

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
