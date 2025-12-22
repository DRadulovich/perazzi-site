import type {
  Archetype,
  ArchetypeBreakdown,
  ArchetypeVector,
} from "@/types/perazzi-assistant";
import type { ArchetypeContext } from "@/lib/perazzi-archetypes.types";
import { getBoostTiers, isTieredBoostsEnabled } from "@/config/archetype-weights";
import { runPerazziArchetypesSelfTest } from "@/lib/perazzi-archetypes.selftest";
import {
  ARCHETYPE_ORDER,
  clampDeltaInPlace,
  computePriorScale,
  getArchetypeConfidenceMin,
  getNeutralArchetypeVector,
  getSmoothingFactor,
  getWinnerRunnerUpAndMargin,
  hasAnyDelta,
  initZeroVector,
  scaleVectorInPlace,
  smoothUpdateArchetypeVector,
} from "@/lib/perazzi-archetypes.core";
import {
  applyHintSignals,
  applyLanguageSignals,
  applyModeSignals,
  applyModelSignals,
  applyPageUrlSignals,
  messageIncludesAny,
  pushSignal,
} from "@/lib/perazzi-archetypes.signals";

function combineDeltas(
  priorDelta: ArchetypeVector,
  languageDelta: ArchetypeVector,
): ArchetypeVector {
  const combinedDelta = initZeroVector();
  ARCHETYPE_ORDER.forEach((k) => {
    combinedDelta[k] = (priorDelta[k] ?? 0) + (languageDelta[k] ?? 0);
  });
  return combinedDelta;
}

function computePrimaryFromVector(updatedVector: ArchetypeVector): Archetype | null {
  const threshold = getArchetypeConfidenceMin();
  const { winner, margin } = getWinnerRunnerUpAndMargin(updatedVector);
  return margin >= threshold ? winner : null;
}

export function computeArchetypeBreakdown(
  ctx: ArchetypeContext,
  previousVector?: ArchetypeVector | null,
  options?: { useTieredBoosts?: boolean },
): ArchetypeBreakdown {
  const useTieredBoosts = options?.useTieredBoosts ?? isTieredBoostsEnabled();
  const startingVector = previousVector
    ? { ...previousVector }
    : getNeutralArchetypeVector();

  const priorDelta = initZeroVector();
  const languageDelta = initZeroVector();
  const signalsUsed: string[] = [];
  const reasoningParts: string[] = [];

  applyModeSignals(ctx, priorDelta, signalsUsed);
  applyPageUrlSignals(ctx, priorDelta, signalsUsed);
  applyModelSignals(ctx, priorDelta, signalsUsed);
  applyLanguageSignals(ctx, languageDelta, signalsUsed, useTieredBoosts);
  applyHintSignals(ctx, languageDelta, signalsUsed, useTieredBoosts);

  const priorScale = computePriorScale(startingVector, languageDelta);
  if (hasAnyDelta(priorDelta) && priorScale < 1) {
    pushSignal(signalsUsed, `priors:scaled:${priorScale.toFixed(2)}`);
  }
  scaleVectorInPlace(priorDelta, priorScale);

  const combinedDelta = combineDeltas(priorDelta, languageDelta);

  // Enforce per-archetype cap across all delta sources before smoothing.
  clampDeltaInPlace(combinedDelta, getBoostTiers().maxPerMessage);

  let updatedVector = smoothUpdateArchetypeVector(startingVector, combinedDelta, getSmoothingFactor());

  // Dev override wins and intentionally dominates the vector.
  if (ctx.devOverrideArchetype) {
    const override = ctx.devOverrideArchetype;

    const overridden: ArchetypeVector = initZeroVector();
    const dominantWeight = 0.7;
    const remainder = 0.3;
    const others = (Object.keys(overridden) as Archetype[]).filter(
      (key) => key !== override
    );

    overridden[override] = dominantWeight;
    const share = remainder / others.length;
    others.forEach((key) => {
      overridden[key] = share;
    });

    updatedVector = overridden;
    pushSignal(signalsUsed, `override:${override}`);
    reasoningParts.push(
      `Archetype manually overridden to "${override}" via dev override phrase.`
    );
  }

  const primary = computePrimaryFromVector(updatedVector);

  if (!ctx.devOverrideArchetype) {
    reasoningParts.push(
      "Archetype inferred from mode, page context, model slug, and language heuristics."
    );
  }

  return {
    primary,
    vector: updatedVector,
    reasoning: reasoningParts.join(" "),
    signalsUsed,
  };
}

// ---------------------------------------------------------------------------
// Dev-only self-test runner (kept near compute logic to reduce size in main).
const __DEV__ = process.env.NODE_ENV === "development";

function maybeRunSelfTest() {
  if (!__DEV__ || (globalThis as { jest?: unknown }).jest !== undefined) return;
  runPerazziArchetypesSelfTest({
    assertEqual: (name, actual, expected) => {
      if (actual !== expected) {
        throw new Error(
          `[perazzi-archetypes] self-test failed: ${name} (expected ${expected}, got ${actual})`
        );
      }
    },
    computeArchetypeBreakdown,
    getArchetypeConfidenceMin,
    getBoostTiers,
    getNeutralArchetypeVector,
    getWinnerRunnerUpAndMargin,
    messageIncludesAny,
  });
}

maybeRunSelfTest();
