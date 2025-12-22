import type { ArchetypeBreakdown, ArchetypeVector } from "@/types/perazzi-assistant";
import type { ArchetypeClassification } from "@/lib/perazzi-archetypes.types";
import {
  ARCHETYPE_KEYS,
  type ArchetypeKey,
  type ArchetypeScores,
  normalizeArchetypeScores,
} from "@/lib/pgpt-insights/archetype-distribution";

const DEFAULT_ARCHETYPE_SCORES: ArchetypeScores = {
  Loyalist: 0.2,
  Prestige: 0.2,
  Analyst: 0.2,
  Achiever: 0.2,
  Legacy: 0.2,
};

export function vectorToArchetypeScores(vector: ArchetypeVector): ArchetypeScores {
  return {
    Loyalist: vector.loyalist ?? 0,
    Prestige: vector.prestige ?? 0,
    Analyst: vector.analyst ?? 0,
    Achiever: vector.achiever ?? 0,
    Legacy: vector.legacy ?? 0,
  };
}

export function normalizeArchetypeScoresOrFallback(
  scores: ArchetypeScores,
): ArchetypeScores {
  return normalizeArchetypeScores(scores) ?? { ...DEFAULT_ARCHETYPE_SCORES };
}

export function pickWinnerAndRunnerUp(scores: ArchetypeScores): {
  winner: ArchetypeKey | null;
  runnerUp: ArchetypeKey | null;
} {
  let winner: ArchetypeKey | null = null;
  let runnerUp: ArchetypeKey | null = null;
  let winnerValue = -Infinity;
  let runnerUpValue = -Infinity;

  for (const key of ARCHETYPE_KEYS) {
    const value = scores[key] ?? 0;
    if (value > winnerValue) {
      runnerUp = winner;
      runnerUpValue = winnerValue;
      winner = key;
      winnerValue = value;
      continue;
    }

    if (value > runnerUpValue) {
      runnerUp = key;
      runnerUpValue = value;
    }
  }

  return { winner, runnerUp };
}

export function buildArchetypeDecision(
  breakdown: ArchetypeBreakdown,
  winner: ArchetypeKey | null,
  runnerUp: ArchetypeKey | null,
): ArchetypeClassification["archetypeDecision"] | undefined {
  if (!breakdown.reasoning && !breakdown.signalsUsed?.length) return undefined;
  return {
    winner,
    runnerUp,
    signals: breakdown.signalsUsed,
    reasoning: breakdown.reasoning,
  };
}

export function buildArchetypeClassification(
  breakdown: ArchetypeBreakdown,
): ArchetypeClassification {
  const rawScores = vectorToArchetypeScores(breakdown.vector);
  const normalized = normalizeArchetypeScoresOrFallback(rawScores);
  const { winner, runnerUp } = pickWinnerAndRunnerUp(normalized);

  return {
    archetype: breakdown.primary,
    archetypeScores: normalized,
    archetypeDecision: buildArchetypeDecision(breakdown, winner, runnerUp),
  };
}
