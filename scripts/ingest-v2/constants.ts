import type { TokenHistogramBin } from "./types";

export const TARGET_TOKENS = 1000;
export const MAX_TOKENS = 1600;
export const MAX_CHARS = 7000;
export const TOKEN_ESTIMATE_DIVISOR = 4; // rough characters-to-tokens approximation
export const DEFAULT_ANALYZE_MAX_CHARS = MAX_CHARS;
export const DEFAULT_ANALYZE_MAX_TOKENS = MAX_TOKENS;
export const DEFAULT_TOP_OUTLIERS = 25;

export const TOKEN_HISTOGRAM_BINS: TokenHistogramBin[] = [
  { label: "0-100", min: 0, max: 100 },
  { label: "101-250", min: 101, max: 250 },
  { label: "251-500", min: 251, max: 500 },
  { label: "501-750", min: 501, max: 750 },
  { label: "751-1000", min: 751, max: 1000 },
  { label: "1001-1250", min: 1001, max: 1250 },
  { label: "1251-1500", min: 1251, max: 1500 },
  { label: "1501-1600", min: 1501, max: 1600 },
  { label: "1600+", min: 1601 },
];

export const LIST_START_REGEX = /^(?:[-*+]|\d+\.)\s+\S/;
