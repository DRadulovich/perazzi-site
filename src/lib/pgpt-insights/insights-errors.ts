import { errorMessage } from "./error-utils";

export type InsightsErrorEntry = {
  id: string;
  sectionId?: string;
  sectionTitle: string;
  message: string;
  at: string;
};

const MAX_ENTRIES = 25;
const entries: InsightsErrorEntry[] = [];

export function recordInsightsError(args: {
  sectionId?: string;
  sectionTitle: string;
  error: unknown;
}): InsightsErrorEntry {
  const message = errorMessage(args.error);
  const entry: InsightsErrorEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sectionId: args.sectionId,
    sectionTitle: args.sectionTitle,
    message,
    at: new Date().toISOString(),
  };

  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  return entry;
}

export function getInsightsErrors(limit = 8): InsightsErrorEntry[] {
  if (limit <= 0) return [];
  return entries.slice(0, limit);
}
