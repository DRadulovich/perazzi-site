import {
  DEFAULT_ESMS_SPEC,
  DEFAULT_INTERACTION_POLICY,
  mergeSpec,
  type DeepPartial,
  type ExpandableInteractionPolicy,
  type ExpandableMotionSpec,
} from "./expandable-section-motion";

export const SECTION_IDS = [
  "home.timelineScroller",
  "home.marqueeFeature",
  "shotguns.platformGrid",
  "shotguns.disciplineRail",
  "shotguns.triggerExplainer",
  "shotguns.engravingGradesCarousel",
  "bespoke.buildStepsScroller",
  "experience.experiencePicker",
  "experience.visitFactory",
  "experience.bookingOptions",
  "experience.travelNetwork",
  "heritage.championsGallery",
] as const;

export type ExpandableSectionId = (typeof SECTION_IDS)[number];

type SpecOverrideMap = Partial<Record<ExpandableSectionId, DeepPartial<ExpandableMotionSpec>>>;
type InteractionOverrideMap = Partial<
  Record<ExpandableSectionId, Partial<ExpandableInteractionPolicy>>
>;

const SECTION_OVERRIDES: SpecOverrideMap = {};
const SECTION_INTERACTIONS: InteractionOverrideMap = {};

export function getSectionSpec(
  sectionId: string,
  routeOverride?: DeepPartial<ExpandableMotionSpec>,
) {
  const override = SECTION_OVERRIDES[sectionId as ExpandableSectionId];
  return mergeSpec(DEFAULT_ESMS_SPEC, routeOverride, override);
}

export function getSectionInteraction(sectionId: string) {
  const override = SECTION_INTERACTIONS[sectionId as ExpandableSectionId];
  return { ...DEFAULT_INTERACTION_POLICY, ...override };
}
