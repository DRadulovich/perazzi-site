export type { ArchetypeClassification, ArchetypeContext } from "@/lib/perazzi-archetypes.types";
export { getModeArchetypeBridgeGuidance, type ModeArchetypeKey } from "@/lib/perazzi-archetype-bridge-guidance";
export { computeArchetypeBreakdown } from "@/lib/perazzi-archetypes.compute";
export { buildArchetypeClassification } from "@/lib/perazzi-archetypes.classification";
export {
  NEUTRAL_ARCHETYPE_VECTOR,
  getNeutralArchetypeVector,
  getSmoothingFactor,
  normalizeArchetypeVector,
  pickPrimaryArchetype,
  smoothUpdateArchetypeVector,
} from "@/lib/perazzi-archetypes.core";
