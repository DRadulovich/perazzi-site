import stringify from "json-stable-stringify";
import { TOKEN_ESTIMATE_DIVISOR } from "./constants";

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / TOKEN_ESTIMATE_DIVISOR));
}

export function slugify(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return (
    value
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(?:^-+|-+$)/g, "") || undefined
  );
}

export function sanitizePricingText(text: string): string {
  return text.replaceAll(/[$€£]?\d[\d,]*(\.\d+)?/g, "<NUM>");
}

export function stableStringify(value: unknown): string {
  // Ensure deterministic ordering for objects before persistence
  const serialized = stringify(value);
  if (serialized === undefined) {
    // json-stable-stringify can yield undefined (e.g., for top-level undefined); fall back to empty string
    return "";
  }
  return serialized;
}

export function preprocessForEmbedding(
  text: string,
  pricingSensitive: boolean,
): string {
  let cleaned = text.replaceAll(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replaceAll(/\s+/g, " ").trim();
  if (pricingSensitive) {
    cleaned = sanitizePricingText(cleaned);
  }
  return cleaned;
}
