export const ARCHETYPE_KEYS = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"] as const;
export type ArchetypeKey = (typeof ARCHETYPE_KEYS)[number];
export type ArchetypeScores = Record<ArchetypeKey, number>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return Number.NaN;
}

/**
 * Accepts:
 *  - { Loyalist: 0.1, ... } already in 0..1
 *  - { Loyalist: 10, ... } percentages in 0..100 (auto-detected)
 * Missing keys are treated as 0.
 * Returns a fully-populated normalized object that sums to 1, or null if invalid.
 */
export function normalizeArchetypeScores(raw: unknown): ArchetypeScores | null {
  if (!isRecord(raw)) return null;

  // pull values
  const values: number[] = [];
  const out: Partial<ArchetypeScores> = {};

  for (const k of ARCHETYPE_KEYS) {
    const v = raw[k];
    const n = toNumber(v);
    const safe = Number.isFinite(n) ? n : 0;
    out[k] = safe;
    values.push(safe);
  }

  const maxVal = Math.max(...values, 0);

  // Heuristic: if any value > 1.5, assume percentages
  const assumedPercent = maxVal > 1.5;

  let sum = 0;
  for (const k of ARCHETYPE_KEYS) {
    const v = out[k] ?? 0;
    const scaled = assumedPercent ? v / 100 : v;
    const clamped = clamp01(scaled);
    out[k] = clamped;
    sum += clamped;
  }

  if (!Number.isFinite(sum) || sum <= 0) return null;

  // normalize
  const normalized: ArchetypeScores = {
    Loyalist: (out.Loyalist ?? 0) / sum,
    Prestige: (out.Prestige ?? 0) / sum,
    Analyst: (out.Analyst ?? 0) / sum,
    Achiever: (out.Achiever ?? 0) / sum,
    Legacy: (out.Legacy ?? 0) / sum,
  };

  return normalized;
}

/**
 * Confidence = top1 - top2 margin (0..1)
 */
export function computeArchetypeConfidence(scores: ArchetypeScores): number {
  const arr = Object.values(scores).filter((n) => Number.isFinite(n));
  arr.sort((a, b) => b - a);
  const top1 = arr[0] ?? 0;
  const top2 = arr[1] ?? 0;
  const margin = top1 - top2;
  return clamp01(margin);
}

export function pickArchetypeWinner(scores: ArchetypeScores): ArchetypeKey {
  let best: ArchetypeKey = ARCHETYPE_KEYS[0];
  let bestScore = -1;

  for (const k of ARCHETYPE_KEYS) {
    const v = scores[k];
    if (v > bestScore) {
      bestScore = v;
      best = k;
    }
  }

  return best;
}

/**
 * Merges archetype distribution fields into metadata.
 * - If raw scores are invalid, metadata is returned unchanged.
 * - If decision is undefined, it is not written.
 */
export function withArchetypeDistribution<T extends Record<string, unknown>>(
  metadata: T,
  rawScores: unknown,
  decision?: unknown,
): T & {
  archetypeScores?: ArchetypeScores;
  archetypeConfidence?: number;
  archetypeDecision?: unknown;
} {
  const normalized = normalizeArchetypeScores(rawScores);
  if (!normalized) return metadata;

  const confidence = computeArchetypeConfidence(normalized);

  const next = { ...metadata, archetypeScores: normalized, archetypeConfidence: confidence } as T & {
    archetypeScores: ArchetypeScores;
    archetypeConfidence: number;
    archetypeDecision?: unknown;
  };
  if (decision !== undefined) next.archetypeDecision = decision;

  return next;
}
