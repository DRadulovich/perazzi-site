import {
  DEFAULT_SPEC,
  mergeSpec,
  type DeepPartial,
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

const SECTION_OVERRIDES: SpecOverrideMap = {};

export function getSectionSpec(
  sectionId: string,
  routeOverride?: DeepPartial<ExpandableMotionSpec>,
) {
  const override = SECTION_OVERRIDES[sectionId as ExpandableSectionId];
  return mergeSpec(DEFAULT_SPEC, routeOverride, override);
}
