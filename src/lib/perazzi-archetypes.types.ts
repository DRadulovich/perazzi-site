import type { Archetype, PerazziMode } from "@/types/perazzi-assistant";
import type {
  ArchetypeKey,
  ArchetypeScores,
} from "@/lib/pgpt-insights/archetype-distribution";

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

