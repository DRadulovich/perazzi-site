import type { Archetype, ArchetypeBreakdown, ArchetypeVector } from "@/types/perazzi-assistant";
import type { ArchetypeContext } from "@/lib/perazzi-archetypes";

type SelfTestDeps = {
  assertEqual: (name: string, actual: boolean, expected: boolean) => void;
  messageIncludesAny: (message: string, needles: string[]) => boolean;
  getArchetypeConfidenceMin: () => number;
  getWinnerRunnerUpAndMargin: (vector: ArchetypeVector) => {
    winner: Archetype;
    margin: number;
  };
  computeArchetypeBreakdown: (
    ctx: ArchetypeContext,
    previousVector: ArchetypeVector,
  ) => ArchetypeBreakdown;
  getNeutralArchetypeVector: () => ArchetypeVector;
  getBoostTiers: () => { maxPerMessage: number };
};

export function runPerazziArchetypesSelfTest({
  assertEqual,
  messageIncludesAny,
  getArchetypeConfidenceMin,
  getWinnerRunnerUpAndMargin,
  computeArchetypeBreakdown,
  getNeutralArchetypeVector,
  getBoostTiers,
}: SelfTestDeps): void {
  assertEqual(
    "broadcast should not match cast",
    messageIncludesAny("broadcast", ["cast"]),
    false,
  );
  assertEqual(
    "casting should not match cast",
    messageIncludesAny("casting", ["cast"]),
    false,
  );
  assertEqual(
    "cast as token should match cast",
    messageIncludesAny("my cast is broken", ["cast"]),
    true,
  );
  assertEqual(
    "phrase match: point of impact",
    messageIncludesAny("Point of Impact matters", ["point of impact"]),
    true,
  );
  assertEqual(
    "phrase match across whitespace normalization",
    messageIncludesAny("point\nof\timpact", ["point of impact"]),
    true,
  );
  assertEqual(
    "hyphenated phrases normalize to spaced tokens",
    messageIncludesAny("handed-down heirloom", ["handed-down"]),
    true,
  );

  const threshold = getArchetypeConfidenceMin();
  const pickPrimaryForTest = (vector: ArchetypeVector) => {
    const { winner, margin } = getWinnerRunnerUpAndMargin(vector);
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

  assertEqual(
    "mixed vector => primary null",
    pickPrimaryForTest(mixedVector) === null,
    true,
  );
  assertEqual(
    "strong analyst vector => primary analyst",
    pickPrimaryForTest(strongAnalystVector) === "analyst",
    true,
  );
  assertEqual(
    "borderline vector => primary null",
    pickPrimaryForTest(borderlineVector) === null,
    true,
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
    getNeutralArchetypeVector(),
  );

  assertEqual(
    "strong legacy language should outweigh prestige priors",
    (legacyBreakdown.vector.legacy ?? 0) > (legacyBreakdown.vector.prestige ?? 0),
    true,
  );

  const vagueCtx: ArchetypeContext = {
    mode: "prospect",
    pageUrl: "/perazzi/bespoke",
    modelSlug: "sco",
    platformSlug: null,
    userMessage: "Tell me about Perazzi.",
    devOverrideArchetype: null,
  };

  const vagueBreakdown = computeArchetypeBreakdown(
    vagueCtx,
    getNeutralArchetypeVector(),
  );

  assertEqual(
    "vague prompt should still be guided by priors (prestige tends to rise)",
    (vagueBreakdown.vector.prestige ?? 0) > 0.2,
    true,
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
    getNeutralArchetypeVector(),
  );

  assertEqual(
    "hints (specs/models) should gently nudge analyst above neutral",
    (hintsAnalystBreakdown.vector.analyst ?? 0) > 0.205,
    true,
  );

  assertEqual(
    "hints alone should not snap primary",
    hintsAnalystBreakdown.primary === null,
    true,
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
    getNeutralArchetypeVector(),
  );

  assertEqual(
    "hints (history/heritage) should gently nudge legacy above neutral",
    (hintsLegacyBreakdown.vector.legacy ?? 0) > 0.205,
    true,
  );

  // New Pass-2 tests
  const scoresheetCtx: ArchetypeContext = {
    mode: null,
    pageUrl: null,
    modelSlug: null,
    platformSlug: null,
    userMessage: "My scoresheet results dropped last season",
  } as unknown as ArchetypeContext;
  const scoresheetBreak = computeArchetypeBreakdown(
    scoresheetCtx,
    getNeutralArchetypeVector(),
  );
  assertEqual(
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
  const heirloomBreak = computeArchetypeBreakdown(
    heirloomCtx,
    getNeutralArchetypeVector(),
  );
  assertEqual(
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
  const loyaltyProgramBreak = computeArchetypeBreakdown(
    loyaltyProgramCtx,
    getNeutralArchetypeVector(),
  );
  assertEqual(
    "loyalty program should NOT trigger loyalist boost",
    (loyaltyProgramBreak.vector.loyalist ?? 0) < 0.25,
    true,
  );

  // Phrase plural edge-case test
  assertEqual(
    "plural phrase should not match singular needle",
    messageIncludesAny("impact points are tricky", ["impact point"]),
    false,
  );

  // Ensure max boost env var respects values >1.0
  const originalMaxEnv = process.env.ARCHETYPE_BOOST_MAX;
  process.env.ARCHETYPE_BOOST_MAX = "1.2";
  assertEqual(
    "env max boost allows >1.0",
    getBoostTiers().maxPerMessage > 1,
    true,
  );
  process.env.ARCHETYPE_BOOST_MAX = originalMaxEnv;
}

