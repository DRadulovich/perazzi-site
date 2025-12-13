export const LOW_SCORE_THRESHOLD = 0.25;
export const LOGS_PAGE_SIZE = 50;
export const DEFAULT_DAYS_WINDOW = 30;

export const UI_TIMEZONE = "America/Chicago";

export const QA_REASON_OPTIONS = [
  "hallucination",
  "bad_tone",
  "wrong_retrieval",
  "guardrail_false_positive",
  "guardrail_false_negative",
  "other",
] as const;

export const CANONICAL_ARCHETYPE_ORDER = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"] as const;

export type QaReasonOption = (typeof QA_REASON_OPTIONS)[number];
export type CanonicalArchetype = (typeof CANONICAL_ARCHETYPE_ORDER)[number];