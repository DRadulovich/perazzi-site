import { LOW_SCORE_THRESHOLD } from "../../lib/pgpt-insights/constants";
import type { PerazziLogPreviewRow } from "../../lib/pgpt-insights/types";

export function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function truncate(text: string, length = 200) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

export function oneLine(text: string): string {
  return text
    .replaceAll("\r\n", "\n")
    .replaceAll(/\s*\n\s*/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function parseScore(score: string | null | undefined): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const POLLUTION_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function stepIntoOwnValue(current: unknown, key: string): unknown | null {
  if (POLLUTION_KEYS.has(key)) return null;
  if (!isRecord(current)) return null;
  const descriptor = Object.getOwnPropertyDescriptor(current, key);
  if (!descriptor) return null;
  return descriptor.value;
}

function readNestedValue(obj: unknown, path: string[]): unknown | null {
  let current: unknown = obj;
  for (const key of path) {
    const next = stepIntoOwnValue(current, key);
    if (next === null) return null;
    current = next;
  }
  return current;
}

export function readNestedNumber(obj: unknown, path: string[]): number | null {
  return toNumberOrNull(readNestedValue(obj, path));
}

export function getTokenMetrics(log: PerazziLogPreviewRow) {
  const promptTokens = toNumberOrNull((log as { prompt_tokens?: unknown }).prompt_tokens);
  const completionTokens = toNumberOrNull((log as { completion_tokens?: unknown }).completion_tokens);
  const metadataObj = isRecord(log.metadata) ? log.metadata : null;
  const responseUsage = metadataObj && isRecord(metadataObj.responseUsage) ? metadataObj.responseUsage : null;

  const cachedTokens =
    toNumberOrNull((log as { cached_tokens?: unknown }).cached_tokens) ??
    readNestedNumber(metadataObj, ["cachedTokens"]) ??
    readNestedNumber(responseUsage, ["input_tokens_details", "cached_tokens"]);

  const reasoningTokens =
    toNumberOrNull((log as { reasoning_tokens?: unknown }).reasoning_tokens) ??
    readNestedNumber(metadataObj, ["reasoningTokens"]) ??
    readNestedNumber(responseUsage, ["output_tokens_details", "reasoning_tokens"]);

  const totalTokens =
    toNumberOrNull((log as { total_tokens?: unknown }).total_tokens) ??
    readNestedNumber(metadataObj, ["totalTokens"]) ??
    readNestedNumber(responseUsage, ["total_tokens"]) ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null);

  return { promptTokens, completionTokens, cachedTokens, reasoningTokens, totalTokens };
}

export function rowToneClass(log: PerazziLogPreviewRow): string {
  if (log.guardrail_status === "blocked") return "border-l-[5px] border-red-500/70";
  if (log.low_confidence === true) return "border-l-[5px] border-amber-500/70";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD) return "border-l-[5px] border-yellow-500/70";

  return "border-l-[5px] border-transparent";
}

export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function getWindowOrNull(): Window | null {
  return (globalThis as { window?: Window }).window ?? null;
}
