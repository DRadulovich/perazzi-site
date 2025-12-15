import {
  Archetype,
  ArchetypeBreakdown,
  ArchetypeVector,
  PerazziMode,
} from "@/types/perazzi-assistant";
import {
  ARCHETYPE_KEYS,
  type ArchetypeKey,
  type ArchetypeScores,
  normalizeArchetypeScores,
} from "@/lib/pgpt-insights/archetype-distribution";

export interface ArchetypeContext {
  mode?: PerazziMode | null;
  pageUrl?: string | null;
  modelSlug?: string | null;
  platformSlug?: string | null;
  /** Latest user message content. */
  userMessage: string;
  /** If present, this wins over inferred primary archetype. */
  devOverrideArchetype?: Archetype | null;
}

export type ArchetypeClassification = {
  archetype: Archetype | null;
  archetypeScores: ArchetypeScores;
  archetypeDecision?: {
    winner: ArchetypeKey | null;
    runnerUp: ArchetypeKey | null;
    signals?: string[];
    reasoning?: string;
  };
};

export const NEUTRAL_ARCHETYPE_VECTOR: ArchetypeVector = {
  loyalist: 0.2,
  prestige: 0.2,
  analyst: 0.2,
  achiever: 0.2,
  legacy: 0.2,
};

const DEFAULT_SMOOTHING = 0.75; // 75% previous, 25% new per message
const ARCHETYPE_ORDER: Archetype[] = [
  "loyalist",
  "prestige",
  "analyst",
  "achiever",
  "legacy",
];

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
  smoothingFactor: number = DEFAULT_SMOOTHING
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

function getArchetypeConfidenceMin(): number {
  const raw = Number(process.env.PERAZZI_ARCHETYPE_CONFIDENCE_MIN);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 0.08;
}

function getWinnerRunnerUpAndMargin(vector: ArchetypeVector): {
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
    const diff = b.v - a.v;
    if (diff !== 0) return diff;
    return ARCHETYPE_ORDER.indexOf(a.k) - ARCHETYPE_ORDER.indexOf(b.k);
  });

  const winner = scored[0]?.k ?? ARCHETYPE_ORDER[0];
  const runnerUp = scored[1]?.k ?? ARCHETYPE_ORDER[1];
  const winnerScore = scored[0]?.v ?? 0;
  const runnerUpScore = scored[1]?.v ?? 0;
  const margin = winnerScore - runnerUpScore;

  return { winner, winnerScore, runnerUp, runnerUpScore, margin };
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeToWordSet(normalizedMessage: string): Set<string> {
  const tokens = normalizedMessage.match(/[a-z0-9']+/g) ?? [];
  return new Set(tokens);
}

function messageIncludesAny(message: string, needles: string[]): boolean {
  const normalizedMessage = normalizeForMatch(message);
  if (!normalizedMessage) return false;

  const tokenSet = tokenizeToWordSet(normalizedMessage);

  for (const rawNeedle of needles) {
    if (!rawNeedle) continue;
    const needle = normalizeForMatch(rawNeedle);
    if (!needle) continue;

    if (/\s/.test(needle)) {
      if (normalizedMessage.includes(needle)) return true;
      continue;
    }

    if (tokenSet.has(needle)) return true;
  }

  return false;
}

function __assertEqual(name: string, actual: boolean, expected: boolean) {
  if (actual !== expected) {
    throw new Error(
      `[perazzi-archetypes] self-test failed: ${name} (expected ${expected}, got ${actual})`
    );
  }
}

if (process.env.NODE_ENV === "development") {
  __assertEqual(
    "broadcast should not match cast",
    messageIncludesAny("broadcast", ["cast"]),
    false
  );
  __assertEqual(
    "casting should not match cast",
    messageIncludesAny("casting", ["cast"]),
    false
  );
  __assertEqual(
    "cast as token should match cast",
    messageIncludesAny("my cast is broken", ["cast"]),
    true
  );
  __assertEqual(
    "phrase match: point of impact",
    messageIncludesAny("Point of Impact matters", ["point of impact"]),
    true
  );
  __assertEqual(
    "phrase match across whitespace normalization",
    messageIncludesAny("point\nof\timpact", ["point of impact"]),
    true
  );

  const threshold = getArchetypeConfidenceMin();
  const pickPrimaryForTest = (v: ArchetypeVector) => {
    const { winner, margin } = getWinnerRunnerUpAndMargin(v);
    return margin >= threshold ? winner : null;
  };

  const mixedVector: ArchetypeVector = {
    loyalist: 0.2,
    prestige: 0.2,
    analyst: 0.2,
    achiever: 0.2,
    legacy: 0.2,
  };

  const strongAnalystVector: ArchetypeVector = {
    loyalist: 0.05,
    prestige: 0.05,
    analyst: 0.7,
    achiever: 0.1,
    legacy: 0.1,
  };

  const borderlineVector: ArchetypeVector = {
    loyalist: 0.26,
    prestige: 0.25,
    analyst: 0.25,
    achiever: 0.12,
    legacy: 0.12,
  };

  __assertEqual(
    "mixed vector => primary null",
    pickPrimaryForTest(mixedVector) === null,
    true
  );
  __assertEqual(
    "strong analyst vector => primary analyst",
    pickPrimaryForTest(strongAnalystVector) === "analyst",
    true
  );
  __assertEqual(
    "borderline vector => primary null",
    pickPrimaryForTest(borderlineVector) === null,
    true
  );

  const strongLegacyCtx: ArchetypeContext = {
    mode: "prospect",
    pageUrl: "/perazzi/bespoke",
    modelSlug: "sco",
    platformSlug: null,
    userMessage: "This is an heirloom. I want to preserve it and pass it down to my kids.",
    devOverrideArchetype: null,
  };

  const legacyBreakdown = computeArchetypeBreakdown(
    strongLegacyCtx,
    getNeutralArchetypeVector()
  );

  __assertEqual(
    "strong legacy language should outweigh prestige priors",
    (legacyBreakdown.vector.legacy ?? 0) > (legacyBreakdown.vector.prestige ?? 0),
    true
  );

  const vagueCtx: ArchetypeContext = {
    mode: "prospect",
    pageUrl: "/perazzi/bespoke",
    modelSlug: "sco",
    platformSlug: null,
    userMessage: "Tell me about Perazzi.",
    devOverrideArchetype: null,
  };

  const vagueBreakdown = computeArchetypeBreakdown(vagueCtx, getNeutralArchetypeVector());

  __assertEqual(
    "vague prompt should still be guided by priors (prestige tends to rise)",
    (vagueBreakdown.vector.prestige ?? 0) > 0.2,
    true
  );
}

function initZeroVector(): ArchetypeVector {
  return {
    loyalist: 0,
    prestige: 0,
    analyst: 0,
    achiever: 0,
    legacy: 0,
  };
}

function hasAnyDelta(vec: ArchetypeVector): boolean {
  return ARCHETYPE_ORDER.some((k) => (vec[k] ?? 0) > 0);
}

function sumDelta(vec: ArchetypeVector): number {
  return ARCHETYPE_ORDER.reduce((sum, k) => sum + Math.max(0, vec[k] ?? 0), 0);
}

function scaleVectorInPlace(vec: ArchetypeVector, factor: number): void {
  ARCHETYPE_ORDER.forEach((k) => {
    vec[k] = (vec[k] ?? 0) * factor;
  });
}

function computePriorScale(
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

function applyModeSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[]
) {
  if (!ctx.mode) return;

  switch (ctx.mode) {
    case "prospect": {
      delta.prestige += 0.3;
      delta.analyst += 0.2;
      delta.achiever += 0.1;
      signals.push("mode:prospect");
      break;
    }
    case "owner": {
      delta.loyalist += 0.25;
      delta.legacy += 0.2;
      delta.analyst += 0.15;
      signals.push("mode:owner");
      break;
    }
    case "navigation": {
      delta.analyst += 0.2;
      signals.push("mode:navigation");
      break;
    }
  }
}

function applyPageUrlSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[]
) {
  const url = ctx.pageUrl?.toLowerCase() || "";

  if (!url) return;

  if (url.includes("heritage") || url.includes("history")) {
    delta.legacy += 0.3;
    delta.loyalist += 0.2;
    signals.push("page:heritage");
  }

  if (
    url.includes("bespoke") ||
    url.includes("custom") ||
    url.includes("gallery")
  ) {
    delta.prestige += 0.3;
    signals.push("page:bespoke");
  }

  if (
    url.includes("shotguns") ||
    url.includes("platform") ||
    url.includes("technical") ||
    url.includes("spec")
  ) {
    delta.analyst += 0.25;
    signals.push("page:technical");
  }

  if (
    url.includes("competition") ||
    url.includes("events") ||
    url.includes("athletes")
  ) {
    delta.achiever += 0.25;
    signals.push("page:competition");
  }
}

function applyModelSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[]
) {
  const modelSlug = ctx.modelSlug?.toLowerCase() || "";

  if (!modelSlug) return;

  // Very rough, heuristic mapping for now. This can be refined from real data later.
  if (modelSlug.includes("sco") || modelSlug.includes("extra")) {
    delta.prestige += 0.35;
    signals.push("model:high-grade");
  }

  if (
    modelSlug.includes("mx8") ||
    modelSlug.includes("mx2000") ||
    modelSlug.includes("high-tech") ||
    modelSlug.includes("ht")
  ) {
    delta.achiever += 0.25;
    delta.analyst += 0.15;
    signals.push("model:competition-workhorse");
  }

  if (
    modelSlug.includes("tm1") ||
    modelSlug.includes("db81") ||
    modelSlug.includes("mx3")
  ) {
    delta.legacy += 0.3;
    signals.push("model:vintage-heritage");
  }
}

function applyLanguageSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[]
) {
  const message = ctx.userMessage.toLowerCase();

  if (!message) return;

  // Prestige: aesthetics, luxury, status, craftsmanship.
  if (
    messageIncludesAny(message, [
      "beautiful",
      "engraving",
      "engravings",
      "wood",
      "stock figure",
      "aesthetic",
      "aesthetics",
      "finish",
      "luxury",
      "luxurious",
      "bespoke",
      "artisanal",
      "craftsmanship",
      "upgrade",
      "presentation",
    ])
  ) {
    delta.prestige += 0.4;
    signals.push("language:prestige");
  }

  // Achiever: performance, scores, competition focus.
  if (
    messageIncludesAny(message, [
      "score",
      "scores",
      "winning",
      "nationals",
      "world championship",
      "competition",
      "high score",
      "performance",
      "consistency",
      "more consistent",
      "tournament",
      "major event",
    ])
  ) {
    delta.achiever += 0.4;
    signals.push("language:achiever");
  }

  // Analyst: specs, mechanics, comparison, technical language.
  if (
    messageIncludesAny(message, [
      "point of impact",
      "poi",
      "trigger weight",
      "rib height",
      "barrel convergence",
      "pattern",
      "patterning",
      "choke",
      "chokes",
      "length of pull",
      "lop",
      "drop at comb",
      "drop at heel",
      "cast",
      "toe",
      "pitch",
      "balance",
      "weight distribution",
      "spec",
      "specs",
      "compare",
      "comparison",
    ])
  ) {
    delta.analyst += 0.45;
    signals.push("language:analyst");
  }

  // Loyalist: emotional bond with brand/gun, long-term ownership.
  if (
    messageIncludesAny(message, [
      "i've always",
      "i have always",
      "had this gun",
      "my perazzi for",
      "for years",
      "for decades",
      "love this gun",
      "favorite gun",
      "my dad's perazzi",
      "my fathers perazzi",
      "loyal",
      "loyalty",
    ])
  ) {
    delta.loyalist += 0.4;
    signals.push("language:loyalist");
  }

  // Legacy: heirloom, passing down, multi-generational story.
  if (
    messageIncludesAny(message, [
      "heirloom",
      "pass it down",
      "passing it down",
      "my kids",
      "my children",
      "next generation",
      "keep it original",
      "preserve",
      "preserving",
      "history of this gun",
      "family gun",
    ])
  ) {
    delta.legacy += 0.4;
    signals.push("language:legacy");
  }

  // General signal for long, structured questions -> slight analyst bias.
  const wordCount = message.split(/\s+/).filter(Boolean).length;
  if (wordCount > 40) {
    delta.analyst += 0.1;
    signals.push("language:long-form-analytic");
  }
}

export function computeArchetypeBreakdown(
  ctx: ArchetypeContext,
  previousVector?: ArchetypeVector | null
): ArchetypeBreakdown {
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
  applyLanguageSignals(ctx, languageDelta, signalsUsed);

  const priorScale = computePriorScale(startingVector, languageDelta);
  if (hasAnyDelta(priorDelta) && priorScale < 1) {
    signalsUsed.push(`priors:scaled:${priorScale.toFixed(2)}`);
  }
  scaleVectorInPlace(priorDelta, priorScale);

  const combinedDelta = initZeroVector();
  ARCHETYPE_ORDER.forEach((k) => {
    combinedDelta[k] = (priorDelta[k] ?? 0) + (languageDelta[k] ?? 0);
  });

  let updatedVector = smoothUpdateArchetypeVector(startingVector, combinedDelta);

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

    updatedVector = normalizeArchetypeVector(overridden);
    signalsUsed.push(`override:${override}`);
    reasoningParts.push(
      `Archetype manually overridden to "${override}" via dev override phrase.`
    );
  }

  const threshold = getArchetypeConfidenceMin();
  const { winner, margin } = getWinnerRunnerUpAndMargin(updatedVector);
  const primary: Archetype | null = margin >= threshold ? winner : null;

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

export function buildArchetypeClassification(
  breakdown: ArchetypeBreakdown,
): ArchetypeClassification {
  const rawScores: ArchetypeScores = {
    Loyalist: breakdown.vector.loyalist ?? 0,
    Prestige: breakdown.vector.prestige ?? 0,
    Analyst: breakdown.vector.analyst ?? 0,
    Achiever: breakdown.vector.achiever ?? 0,
    Legacy: breakdown.vector.legacy ?? 0,
  };

  const normalized = normalizeArchetypeScores(rawScores) ?? {
    Loyalist: 0.2,
    Prestige: 0.2,
    Analyst: 0.2,
    Achiever: 0.2,
    Legacy: 0.2,
  };

  const sorted = ARCHETYPE_KEYS.map((key) => ({
    key,
    value: normalized[key] ?? 0,
  })).sort((a, b) => b.value - a.value);

  const winner = sorted[0]?.key ?? null;
  const runnerUp = sorted[1]?.key ?? null;

  const archetype: Archetype | null = breakdown.primary;

  const decision =
    breakdown.reasoning || (breakdown.signalsUsed && breakdown.signalsUsed.length)
      ? {
          winner: winner ?? null,
          runnerUp: runnerUp ?? null,
          signals: breakdown.signalsUsed,
          reasoning: breakdown.reasoning,
        }
      : undefined;

  return {
    archetype,
    archetypeScores: normalized,
    archetypeDecision: decision,
  };
}

export type ModeArchetypeKey = `${PerazziMode}:${Archetype}`;

const MODE_ARCHETYPE_BRIDGE: Partial<Record<ModeArchetypeKey, string>> = {
  "prospect:analyst": `
When a new prospective buyer has an Analyst profile:
- Start by briefly reflecting their technical curiosity (POI, balance, platform logic).
- Connect that curiosity to Perazzi's obsession with repeatable mechanics, serviceability, and long-term fitting.
- Gently reframe decisions from "Which spec is best today?" to "Which spec best supports decades of growth with one instrument?".
`,
  "prospect:achiever": `
When a new prospective buyer has an Achiever profile:
- Acknowledge their drive for scores, consistency, and performing well at majors.
- Connect that drive to Perazzi's view of a gun as a long-term performance partner, not a quick advantage.
- Emphasize how stability, serviceability, and fitting protect performance over full seasons, not just a single event.
`,
  "prospect:prestige": `
When a new prospective buyer has a Prestige profile:
- Recognize that aesthetics, presentation, and how the gun "speaks" on the stand matter to them.
- Connect that sensitivity to Perazzi's craftsmanship: wood, engraving, metalwork, and balance as a single artistic decision.
- Reframe the decision as choosing an instrument they can grow into and carry with confidence for years, not just something that looks impressive now.
`,
  "owner:analyst": `
When an existing owner has an Analyst profile:
- Reflect their attention to detail in how the gun behaves now (recoil, POI, patterns, balance).
- Tie adjustments and service back to Perazzi's philosophy of maintaining one fitted instrument over time.
- Explain tradeoffs clearly so they can see how small changes preserve the core feel of their gun while solving specific problems.
`,
  "owner:achiever": `
When an existing owner has an Achiever profile:
- Acknowledge recent performance experiences (good or bad) without overreacting.
- Frame any changes as refinements to a long-term partnership with the same gun, not wholesale resets.
- Emphasize that stability, familiarity, and trust in the gun are part of how champions sustain results.
`,
  "owner:prestige": `
When an existing owner has a Prestige profile:
- Recognize the emotional and aesthetic relationship they already have with their gun.
- Discuss upgrades, refinements, or service in terms of preserving and enhancing that instrument, not replacing its character.
- Emphasize care, restoration, and continuity so they feel their gun is becoming "more itself" over time.
`,
  "owner:legacy": `
When an existing owner has a Legacy profile:
- Acknowledge the story tied to this gun: who it came from, where it has been shot, and who it may be passed to.
- Frame decisions around preservation, safety, and keeping the gun mechanically healthy for the next chapter.
- Emphasize Perazzi's role as a steward of that history through proper service and documentation.
`,
};

const DEFAULT_BRIDGE_GUIDANCE = `
Treat the user as a balanced mix of Loyalist, Prestige, Analyst, Achiever, and Legacy.

Always:
- Briefly reflect their concern in their own terms.
- Then reinterpret that concern through Perazzi's core pillars: long-term partnership with one fitted instrument, meticulous craftsmanship, and serious competition use.
- Close with a concrete next step that keeps the relationship between the shooter and their gun at the center.
`;

export function getModeArchetypeBridgeGuidance(
  mode?: PerazziMode | null,
  archetype?: Archetype | null,
): string {
  if (!mode || !archetype) {
    return DEFAULT_BRIDGE_GUIDANCE;
  }

  const key = `${mode}:${archetype}` as ModeArchetypeKey;
  return MODE_ARCHETYPE_BRIDGE[key] ?? DEFAULT_BRIDGE_GUIDANCE;
}
