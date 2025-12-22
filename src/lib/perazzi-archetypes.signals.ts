import type { Archetype, ArchetypeVector } from "@/types/perazzi-assistant";
import type { ArchetypeContext } from "@/lib/perazzi-archetypes.types";
import { getArchetypeLexicon } from "@/config/archetype-lexicon";
import { getBoostTiers } from "@/config/archetype-weights";

// Utility helper: push a signal only if collection is below the 15-item cap.
export function pushSignal(signals: string[], sig: string): void {
  if (signals.length < 15) signals.push(sig);
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replaceAll(/[-–—]/g, " ")
    .replaceAll(/[’‘]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function tokenizeToWordSet(normalizedMessage: string): Set<string> {
  const tokens = normalizedMessage.match(/[a-z0-9']+/g) ?? [];
  return new Set(tokens);
}

function isWordBoundary(char: string | undefined): boolean {
  // Treat start/end of string or any non-alphanumeric / apostrophe char as a boundary.
  return !char || !/[a-z0-9']/i.test(char);
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  for (const needle of needles) {
    if (haystack.includes(needle)) return true;
  }
  return false;
}

function phraseMatchesAtWordBoundary(haystack: string, phrase: string): boolean {
  let idx = haystack.indexOf(phrase);
  while (idx !== -1) {
    const before = haystack[idx - 1];
    const after = haystack[idx + phrase.length];
    if (isWordBoundary(before) && isWordBoundary(after)) return true;
    idx = haystack.indexOf(phrase, idx + phrase.length);
  }
  return false;
}

function findFirstMatch(message: string, needles: string[]): string | null {
  const normalizedMessage = normalizeForMatch(message);
  if (!normalizedMessage) return null;
  const tokenSet = tokenizeToWordSet(normalizedMessage);

  for (const rawNeedle of needles) {
    const needle = normalizeForMatch(rawNeedle);
    if (!needle) continue;

    if (needle.includes(" ")) {
      // Multi-word phrase: use indexOf + boundary checks instead of dynamic RegExp.
      if (phraseMatchesAtWordBoundary(normalizedMessage, needle)) return rawNeedle;
      continue;
    }

    if (tokenSet.has(needle)) return rawNeedle;
  }
  return null;
}

export function messageIncludesAny(message: string, needles: string[]): boolean {
  return findFirstMatch(message, needles) !== null;
}

function normalizeHintList(input?: string[] | null): Set<string> {
  if (!Array.isArray(input)) return new Set();
  const out = new Set<string>();
  for (const value of input) {
    const normalized = String(value ?? "").toLowerCase().trim();
    if (normalized) out.add(normalized);
  }
  return out;
}

export function applyHintSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[],
  useTieredBoosts: boolean,
) {
  const intents = normalizeHintList(ctx.intents);
  const topics = normalizeHintList(ctx.topics);

  if (intents.size === 0 && topics.size === 0) return;

  const tiersHint = getBoostTiers();
  // (high-tier value reserved for future use)
  const MID = useTieredBoosts ? tiersHint.mid : 0.06;
  const LOW = useTieredBoosts ? tiersHint.low : 0.05;
  const MAX = tiersHint.maxPerMessage;

  const addBoost = (arch: Archetype, amt: number, reason: string) => {
    const current = delta[arch] ?? 0;
    delta[arch] = Math.min(current + amt, MAX);
    pushSignal(signals, `hint:${arch}:${reason}`);
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

  const baseAnalyst = useTieredBoosts ? LOW : 0.06;
  const basePrestige = useTieredBoosts ? MID : 0.06;
  const baseLegacy = useTieredBoosts ? MID : 0.06;
  const baseAchiever = useTieredBoosts ? LOW : 0.05;
  const baseLoyalist = useTieredBoosts ? LOW : 0.05;

  if (analystHint) addBoost("analyst", baseAnalyst, "models/specs");
  if (prestigeHint) addBoost("prestige", basePrestige, "bespoke");
  if (legacyHint) addBoost("legacy", baseLegacy, "heritage");
  if (achieverHint) addBoost("achiever", baseAchiever, "events/olympic");
  if (loyalistHint) addBoost("loyalist", baseLoyalist, "service");
}

export function applyModeSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[],
) {
  if (!ctx.mode) return;

  switch (ctx.mode) {
    case "prospect": {
      delta.prestige += 0.3;
      delta.analyst += 0.2;
      delta.achiever += 0.1;
      pushSignal(signals, "mode:prospect");
      break;
    }
    case "owner": {
      delta.loyalist += 0.25;
      delta.legacy += 0.2;
      delta.analyst += 0.15;
      pushSignal(signals, "mode:owner");
      break;
    }
    case "navigation": {
      delta.analyst += 0.2;
      pushSignal(signals, "mode:navigation");
      break;
    }
  }
}

export function applyPageUrlSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[],
) {
  const url = ctx.pageUrl?.toLowerCase() || "";
  if (!url) return;

  if (includesAny(url, ["heritage", "history"])) {
    delta.legacy += 0.3;
    delta.loyalist += 0.2;
    pushSignal(signals, "page:heritage");
  }

  if (includesAny(url, ["bespoke", "custom", "gallery"])) {
    delta.prestige += 0.3;
    pushSignal(signals, "page:bespoke");
  }

  if (includesAny(url, ["shotguns", "platform", "technical", "spec"])) {
    delta.analyst += 0.25;
    pushSignal(signals, "page:technical");
  }

  if (includesAny(url, ["competition", "events", "athletes"])) {
    delta.achiever += 0.25;
    pushSignal(signals, "page:competition");
  }
}

export function applyModelSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[],
) {
  const modelSlug = ctx.modelSlug?.toLowerCase() || "";
  if (!modelSlug) return;

  // Very rough, heuristic mapping for now. This can be refined from real data later.
  if (includesAny(modelSlug, ["sco", "extra"])) {
    delta.prestige += 0.35;
    pushSignal(signals, "model:high-grade");
  }

  if (includesAny(modelSlug, ["mx8", "mx2000", "high-tech", "ht"])) {
    delta.achiever += 0.25;
    delta.analyst += 0.15;
    pushSignal(signals, "model:competition-workhorse");
  }

  if (includesAny(modelSlug, ["tm1", "db81", "mx3"])) {
    delta.legacy += 0.3;
    pushSignal(signals, "model:vintage-heritage");
  }
}

type ArchetypeLexiconEntry = {
  high?: string[];
  mid?: string[];
  low?: string[];
  negatives?: string[];
};

function pickLexiconMatchAndBoost(
  message: string,
  entry: ArchetypeLexiconEntry,
  boosts: { high: number; mid: number; low: number },
): { matched: string | null; boost: number } {
  if (entry.high?.length) {
    const matched = findFirstMatch(message, entry.high);
    if (matched) return { matched, boost: boosts.high };
  }

  if (entry.mid?.length) {
    const matched = findFirstMatch(message, entry.mid);
    if (matched) return { matched, boost: boosts.mid };
  }

  if (entry.low?.length) {
    const matched = findFirstMatch(message, entry.low);
    if (matched) return { matched, boost: boosts.low };
  }

  return { matched: null, boost: 0 };
}

export function applyLanguageSignals(
  ctx: ArchetypeContext,
  delta: ArchetypeVector,
  signals: string[],
  useTieredBoosts: boolean,
) {
  const message = ctx.userMessage.toLowerCase();
  if (!message) return;

  // --- Pass-2 lexicon-based detection ---
  const lexicon = getArchetypeLexicon();

  const {
    high: T_HIGH,
    mid: T_MID,
    low: T_LOW,
    maxPerMessage: MAX_BOOST_PER_ARCH,
  } = getBoostTiers();
  const BOOST_HIGH = useTieredBoosts ? T_HIGH : 0.4;
  const BOOST_MID = useTieredBoosts ? T_MID : 0.3;
  const BOOST_LOW = useTieredBoosts ? T_LOW : 0.15;

  const boosts = { high: BOOST_HIGH, mid: BOOST_MID, low: BOOST_LOW };

  for (const key of Object.keys(lexicon) as Archetype[]) {
    const entry = lexicon[key] as ArchetypeLexiconEntry | undefined;
    if (!entry) continue;

    if (entry.negatives?.length && messageIncludesAny(message, entry.negatives)) {
      continue;
    }

    const { matched, boost } = pickLexiconMatchAndBoost(message, entry, boosts);
    if (!matched || boost <= 0) continue;

    const current = delta[key] ?? 0;
    delta[key] = Math.min(current + boost, MAX_BOOST_PER_ARCH);
    pushSignal(signals, `lang:${key}:${matched}`);
  }

  // General signal for long, structured questions -> slight analyst bias.
  const wordCount = message.split(/\s+/).filter(Boolean).length;
  if (wordCount > 40) {
    delta.analyst += 0.1;
    pushSignal(signals, "language:long-form-analytic");
  }
}
