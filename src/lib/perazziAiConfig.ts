import type { CreateResponseTextParams } from "@/lib/aiClient";

export function resolveModel(defaultModel: string): string {
  const candidate =
    process.env.PERAZZI_MODEL ??
    process.env.PERAZZI_RESPONSES_MODEL ??
    process.env.PERAZZI_COMPLETIONS_MODEL ??
    "";
  const trimmed = candidate.trim();
  return trimmed || defaultModel;
}

export function resolveMaxOutputTokens(fallback: number): number {
  const raw =
    process.env.PERAZZI_MAX_OUTPUT_TOKENS ??
    process.env.PERAZZI_MAX_COMPLETION_TOKENS ??
    "";
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

export function parseReasoningEffort(
  value: string | null | undefined,
): CreateResponseTextParams["reasoningEffort"] {
  const normalized = value?.trim().toLowerCase();
  const allowed = new Set(["none", "low", "medium", "high", "xhigh"]);
  if (normalized && allowed.has(normalized)) {
    return normalized as CreateResponseTextParams["reasoningEffort"];
  }
  // "minimal" is not a valid OpenAI effort value; omit reasoning config.
  return undefined;
}

export function parseTextVerbosity(
  value: unknown,
): CreateResponseTextParams["textVerbosity"] | undefined {
  const normalized = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized as CreateResponseTextParams["textVerbosity"];
  }
  return undefined;
}

export function parsePromptCacheRetention(
  value: string | null | undefined,
): CreateResponseTextParams["promptCacheRetention"] {
  const raw = value?.trim().toLowerCase();
  if (!raw) return undefined;

  const canonical = raw.replaceAll("-", "_");
  const allowed = new Set(["in_memory", "24h"]);
  if (allowed.has(canonical)) {
    return canonical as CreateResponseTextParams["promptCacheRetention"];
  }
  return undefined;
}

export function parsePromptCacheKey(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export function parseTemperature(value: string | null | undefined, fallback: number): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    if (parsed < 0) return 0;
    if (parsed > 2) return 2;
    return parsed;
  }
  return fallback;
}

export function isUsingGateway(): boolean {
  const forceDirect = process.env.AI_FORCE_DIRECT === "true";
  if (forceDirect) return false;
  return Boolean(process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_TOKEN);
}
