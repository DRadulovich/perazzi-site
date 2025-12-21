import { Archetype } from "@/types/perazzi-assistant";

export type ArchetypeKeywordLexicon = Record<Archetype, readonly string[]>;

/**
 * Default keyword lists – migrated from hard-coded arrays in perazzi-archetypes.ts.
 * Keeping them untouched for Pass 1 so behaviour is identical.
 */
export const DEFAULT_LEXICON: ArchetypeKeywordLexicon = {
  loyalist: [
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
  ],
  prestige: [
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
  ],
  analyst: [
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
  ],
  achiever: [
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
  ],
  legacy: [
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
  ],
};

/**
 * Future-proof hook: when PERAZZI_ENABLE_EXPANDED_LEXICON=1 we could load
 * an alternative set from a remote or file.  For Pass 1 we simply return the
 * defaults so behaviour is unchanged.
 */
export function getArchetypeLexicon(): ArchetypeKeywordLexicon {
   
  const flag = (process.env.PERAZZI_ENABLE_EXPANDED_LEXICON ?? "").toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes" || flag === "on") {
    // Placeholder: later passes may load a custom lexicon here.
    // For now we fall back to defaults to avoid changing behaviour.
  }
  return DEFAULT_LEXICON;
}
