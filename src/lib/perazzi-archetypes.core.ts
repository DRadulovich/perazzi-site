import type { Archetype, ArchetypeVector } from "@/types/perazzi-assistant";

export const ARCHETYPE_ORDER: Archetype[] = [
  "loyalist",
  "prestige",
  "analyst",
  "achiever",
  "legacy",
];

export const NEUTRAL_ARCHETYPE_VECTOR: ArchetypeVector = {
  loyalist: 0.2,
  prestige: 0.2,
  analyst: 0.2,
  achiever: 0.2,
  legacy: 0.2,
};

export function getSmoothingFactor(): number {
  const raw = Number(process.env.PERAZZI_SMOOTHING_FACTOR);
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.75; // 75% previous, 25% new per message
}

export function getNeutralArchetypeVector(): ArchetypeVector {
  return { ...NEUTRAL_ARCHETYPE_VECTOR };
}

export function normalizeArchetypeVector(vec: ArchetypeVector): ArchetypeVector {
  const sum =
    Object.values(vec).reduce((acc, value) => acc + (value || 0), 0) || 1;

  const normalized: ArchetypeVector = { ...vec };
  (Object.keys(vec) as Archetype[]).forEach((key) => {
    normalized[key] = (vec[key] || 0) / sum;
  });

  return normalized;
}

export function smoothUpdateArchetypeVector(
  previous: ArchetypeVector,
  delta: ArchetypeVector,
  smoothingFactor: number = getSmoothingFactor()
): ArchetypeVector {
  const updated: ArchetypeVector = { ...previous };

  (Object.keys(previous) as Archetype[]).forEach((key) => {
    const base = previous[key] || 0;
    const adjustment = delta[key] || 0;
    const raw = base + adjustment;

    // Blend previous and new so we avoid whiplash in the profile.
    updated[key] = smoothingFactor * base + (1 - smoothingFactor) * raw;
  });

  return normalizeArchetypeVector(updated);
}

export function pickPrimaryArchetype(
  vec: ArchetypeVector
): Archetype | null {
  let best: Archetype | null = null;
  let bestScore = 0;

  (Object.keys(vec) as Archetype[]).forEach((key) => {
    const score = vec[key] || 0;
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  });

  return best;
}

export function getArchetypeConfidenceMin(): number {
  const raw = Number(process.env.PERAZZI_ARCHETYPE_CONFIDENCE_MIN);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 0.08;
}

export function getWinnerRunnerUpAndMargin(vector: ArchetypeVector): {
  winner: Archetype;
  winnerScore: number;
  runnerUp: Archetype;
  runnerUpScore: number;
  margin: number;
} {
  const scored = ARCHETYPE_ORDER.map((k) => {
    const v = Number(vector[k] ?? 0);
    return { k, v: Number.isFinite(v) ? v : 0 };
  });

  scored.sort((a, b) => {
    return (
      b.v - a.v ||
      ARCHETYPE_ORDER.indexOf(a.k) - ARCHETYPE_ORDER.indexOf(b.k)
    );
  });

  const winner = scored[0]?.k ?? ARCHETYPE_ORDER[0];
  const runnerUp = scored[1]?.k ?? ARCHETYPE_ORDER[1];
  const winnerScore = scored[0]?.v ?? 0;
  const runnerUpScore = scored[1]?.v ?? 0;
  const margin = winnerScore - runnerUpScore;

  return { winner, winnerScore, runnerUp, runnerUpScore, margin };
}

export function initZeroVector(): ArchetypeVector {
  return {
    loyalist: 0,
    prestige: 0,
    analyst: 0,
    achiever: 0,
    legacy: 0,
  };
}

export function hasAnyDelta(vec: ArchetypeVector): boolean {
  return ARCHETYPE_ORDER.some((k) => (vec[k] ?? 0) > 0);
}

export function sumDelta(vec: ArchetypeVector): number {
  return ARCHETYPE_ORDER.reduce((sum, k) => sum + Math.max(0, vec[k] ?? 0), 0);
}

export function scaleVectorInPlace(vec: ArchetypeVector, factor: number): void {
  ARCHETYPE_ORDER.forEach((k) => {
    vec[k] = (vec[k] ?? 0) * factor;
  });
}

// ---------------------------------------------------------------------------
// Utility: clamp any delta so it never exceeds the per-message cap.
export function clampDeltaInPlace(vec: ArchetypeVector, cap: number): void {
  ARCHETYPE_ORDER.forEach((k) => {
    if ((vec[k] ?? 0) > cap) vec[k] = cap;
  });
}

export function computePriorScale(
  startingVector: ArchetypeVector,
  languageDelta: ArchetypeVector,
): number {
  const LANGUAGE_STRONG = 0.35;
  const MIN_SCALE_FROM_LANGUAGE = 0.25;
  const DAMP_FACTOR = 0.75;

  const languageMass = sumDelta(languageDelta);
  const languageStrength = Math.min(1, Math.max(0, languageMass / LANGUAGE_STRONG));
  const languageScale = Math.max(
    MIN_SCALE_FROM_LANGUAGE,
    1 - DAMP_FACTOR * languageStrength,
  );

  const threshold = getArchetypeConfidenceMin();
  const normalizedStart = normalizeArchetypeVector({ ...startingVector });
  const { margin: startMargin } = getWinnerRunnerUpAndMargin(normalizedStart);
  const profileScale = startMargin >= threshold ? 0.6 : 1;

  const finalScale = Math.max(0.15, Math.min(1, languageScale * profileScale));
  return finalScale;
}

