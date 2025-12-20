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
import { getArchetypeLexicon } from "@/config/archetype-lexicon";
import { getBoostTiers, isTieredBoostsEnabled } from "@/config/archetype-weights";

export interface ArchetypeContext {
  mode?: PerazziMode | null;
  pageUrl?: string | null;
  modelSlug?: string | null;
  platformSlug?: string | null;
  intents?: string[] | null;
  topics?: string[] | null;
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

export function getSmoothingFactor(): number {
  const raw = Number(process.env.PERAZZI_SMOOTHING_FACTOR);
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.75; // 75% previous, 25% new per message
}

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

function findFirstMatch(message: string, needles: string[]): string | null {
  const normalizedMessage = normalizeForMatch(message);
  if (!normalizedMessage) return null;
  const tokenSet = tokenizeToWordSet(normalizedMessage);
  for (const rawNeedle of needles) {
    if (!rawNeedle) continue;
    const needle = normalizeForMatch(rawNeedle);
    if (!needle) continue;
    if (/\s/.test(needle)) {
      if (normalizedMessage.includes(needle)) return rawNeedle;
      continue;
    }
    if (tokenSet.has(needle)) return rawNeedle;
  }
  return null;
}

function messageIncludesAny(message: string, needles: string[]): boolean {
  return findFirstMatch(message, needles) !== null;
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

  const hintsOnlyAnalystCtx: ArchetypeContext = {
    mode: null,
    pageUrl: null,
    modelSlug: null,
    platformSlug: null,
    intents: ["models"],
    topics: ["specs"],
    userMessage: "Tell me about Perazzi.",
    devOverrideArchetype: null,
  };

  const hintsAnalystBreakdown = computeArchetypeBreakdown(
    hintsOnlyAnalystCtx,
    getNeutralArchetypeVector()
  );

  __assertEqual(
    "hints (specs/models) should gently nudge analyst above neutral",
    (hintsAnalystBreakdown.vector.analyst ?? 0) > 0.205,
    true
  );

  __assertEqual(
    "hints alone should not snap primary",
    hintsAnalystBreakdown.primary === null,
    true
  );

  const hintsOnlyLegacyCtx: ArchetypeContext = {
    mode: null,
    pageUrl: null,
    modelSlug: null,
    platformSlug: null,
    intents: ["heritage"],
    topics: ["history"],
    userMessage: "Tell me about Perazzi.",
    devOverrideArchetype: null,
  };

  const hintsLegacyBreakdown = computeArchetypeBreakdown(
    hintsOnlyLegacyCtx,
    getNeutralArchetypeVector()
  );

  __assertEqual(
    "hints (history/heritage) should gently nudge legacy above neutral",
    (hintsLegacyBreakdown.vector.legacy ?? 0) > 0.205,
    true
  );

  // New Pass-2 tests
  const scoresheetCtx: ArchetypeContext = {
    mode: null,
    pageUrl: null,
    modelSlug: null,
    platformSlug: null,
    userMessage: "My scoresheet results dropped last season",
  } as unknown as ArchetypeContext;
  const scoresheetBreak = computeArchetypeBreakdown(scoresheetCtx, getNeutralArchetypeVector());
  __assertEqual(
    "scoresheet results should boost achiever",
    (scoresheetBreak.vector.achiever ?? 0) > 0.24,
    true,
  );

  const heirloomCtx: ArchetypeContext = {
    mode: null,
    pageUrl: null,
    modelSlug: null,
    platformSlug: null,
    userMessage: "This gun is a family heirloom handed-down for generations",
  } as unknown as ArchetypeContext;
  const heirloomBreak = computeArchetypeBreakdown(heirloomCtx, getNeutralArchetypeVector());
  __assertEqual(
    "family heirloom should boost legacy",
    (heirloomBreak.vector.legacy ?? 0) > 0.24,
    true,
  );

  const loyaltyProgramCtx: ArchetypeContext = {
    mode: null,
    pageUrl: null,
    modelSlug: null,
    platformSlug: null,
    userMessage: "Tell me about your loyalty program",
  } as unknown as ArchetypeContext;
  const loyaltyProgramBreak = computeArchetypeBreakdown(loyaltyProgramCtx, getNeutralArchetypeVector());
  __assertEqual(
    "loyalty program should NOT trigger loyalist boost",
    (loyaltyProgramBreak.vector.loyalist ?? 0) < 0.25,
    true,
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

function normalizeHintList(input?: string[] | null): Set<string> {
  if (!Array.isArray(input)) return new Set();
  const out = new Set<string>();
  input.forEach((v) => {
    const s = String(v ?? "").toLowerCase().trim();
    if (s) out.add(s);
  });
  return out;
}

function applyHintSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[],
) {
  const intents = normalizeHintList(ctx.intents);
  const topics = normalizeHintList(ctx.topics);

  if (intents.size === 0 && topics.size === 0) return;

  const tier = isTieredBoostsEnabled();
  const tiersHint = getBoostTiers();
  const HIGH = tier ? tiersHint.high : 0.06; // not used now
  const MID = tier ? tiersHint.mid : 0.06;
  const LOW = tier ? tiersHint.low : 0.05;
  const MAX = tiersHint.maxPerMessage;

  const pushSignal = (sig: string) => {
    if (signals.length < 15) signals.push(sig);
  };
  const addBoost = (arch: Archetype, amt: number, reason: string) => {
    const current = delta[arch] ?? 0;
    delta[arch] = Math.min(current + amt, MAX);
    pushSignal(`hint:${arch}:${reason}`);
  };

  const analystHint =
    topics.has("specs") ||
    topics.has("rib_adjustable") ||
    topics.has("rib_fixed") ||
    topics.has("models") ||
    intents.has("models");

  const prestigeHint =
    topics.has("bespoke") ||
    topics.has("grade_sco") ||
    topics.has("grade_sc3") ||
    topics.has("grade_lusso") ||
    intents.has("bespoke");

  const legacyHint =
    topics.has("heritage") ||
    topics.has("history") ||
    intents.has("heritage");

  const achieverHint =
    topics.has("olympic") ||
    topics.has("athletes") ||
    topics.has("events") ||
    intents.has("olympic") ||
    intents.has("events");

  const loyalistHint =
    topics.has("service") ||
    topics.has("care") ||
    intents.has("service");

  const baseAnalyst = tier ? LOW : 0.06;
  const basePrestige = tier ? MID : 0.06;
  const baseLegacy = tier ? MID : 0.06;
  const baseAchiever = tier ? LOW : 0.05;
  const baseLoyalist = tier ? LOW : 0.05;

  if (analystHint) addBoost("analyst", baseAnalyst, "models/specs");
  if (prestigeHint) addBoost("prestige", basePrestige, "bespoke");
  if (legacyHint) addBoost("legacy", baseLegacy, "heritage");
  if (achieverHint) addBoost("achiever", baseAchiever, "events/olympic");
  if (loyalistHint) addBoost("loyalist", baseLoyalist, "service");
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

  // --- Pass-2 lexicon-based detection ---
  const lexicon = getArchetypeLexicon();
  const tiered = isTieredBoostsEnabled();

  const { high: T_HIGH, mid: T_MID, low: T_LOW, maxPerMessage: MAX_BOOST_PER_ARCH } = getBoostTiers();
  const BOOST_HIGH = tiered ? T_HIGH : 0.4;
  const BOOST_MID = tiered ? T_MID : 0.3;
  const BOOST_LOW = tiered ? T_LOW : 0.15;

  const pushSignal = (sig: string) => {
    if (signals.length < 15) signals.push(sig);
  };

  (Object.keys(lexicon) as Archetype[]).forEach((key) => {
    const entry = lexicon[key];
    if (!entry) return;
    const { high, mid, low, negatives } = entry as {
      high: string[];
      mid: string[];
      low: string[];
      negatives?: string[];
    };

    if (negatives && negatives.length && messageIncludesAny(message, negatives)) return;

    let boost = 0;
    let matched: string | null = null;
    if (high?.length) {
      matched = findFirstMatch(message, high);
      if (matched) boost = BOOST_HIGH;
    }
    if (!matched && mid?.length) {
      matched = findFirstMatch(message, mid);
      if (matched) boost = BOOST_MID;
    }
    if (!matched && low?.length) {
      matched = findFirstMatch(message, low);
      if (matched) boost = BOOST_LOW;
    }

    if (boost > 0 && matched) {
      const current = delta[key] ?? 0;
      delta[key] = Math.min(current + boost, MAX_BOOST_PER_ARCH);
      pushSignal(`lang:${key}:${matched}`);
    }
  });

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
  applyHintSignals(ctx, languageDelta, signalsUsed);

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
