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
    .replace(/\r\n/g, "\n")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
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
type SafeValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function stepIntoOwnValue(current: SafeValue, key: string): SafeValue {
  if (POLLUTION_KEYS.has(key)) return undefined;
  if (!isRecord(current)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(current, key);
  if (!descriptor) return undefined;
  return descriptor.value as SafeValue;
}

function readNestedValue(obj: unknown, path: string[]): SafeValue {
  let current: SafeValue = obj as SafeValue;
  for (const key of path) {
    const next = stepIntoOwnValue(current, key);
    if (typeof next === "undefined") return undefined;
    current = next;
  }
  return current;
}

export function readNestedNumber(obj: unknown, path: string[]): number | null {
  return toNumberOrNull(readNestedValue(obj, path));
}

function firstNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    const n = toNumberOrNull(value);
    if (n !== null) return n;
  }
  return null;
}

export function getTokenMetrics(log: PerazziLogPreviewRow) {
  const promptTokens = firstNumber((log as { prompt_tokens?: unknown }).prompt_tokens);
  const completionTokens = firstNumber((log as { completion_tokens?: unknown }).completion_tokens);
  const metadataObj = isRecord(log.metadata) ? log.metadata : null;
  const responseUsage = metadataObj && isRecord(metadataObj.responseUsage) ? metadataObj.responseUsage : null;

  const cachedTokens = firstNumber(
    (log as { cached_tokens?: unknown }).cached_tokens,
    readNestedNumber(metadataObj, ["cachedTokens"]),
    readNestedNumber(responseUsage, ["input_tokens_details", "cached_tokens"]),
  );

  const reasoningTokens = firstNumber(
    (log as { reasoning_tokens?: unknown }).reasoning_tokens,
    readNestedNumber(metadataObj, ["reasoningTokens"]),
    readNestedNumber(responseUsage, ["output_tokens_details", "reasoning_tokens"]),
  );

  const totalTokens = firstNumber(
    (log as { total_tokens?: unknown }).total_tokens,
    readNestedNumber(metadataObj, ["totalTokens"]),
    readNestedNumber(responseUsage, ["total_tokens"]),
    promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null,
  );

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
