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

const SECTION_OVERRIDES: SpecOverrideMap = {
  "home.marqueeFeature": {
    timeScale: {
      expand: 0.85,
      collapse: 0.6,
    },
    stagger: {
      expand: {
        items: 0.06,
        maxTotal: 0.35,
      },
    },
  },
  "home.timelineScroller": {
    timeScale: {
      expand: 0.8,
      collapse: 0.6,
    },
    text: {
      enableCharReveal: false,
    },
    stagger: {
      expand: {
        items: 0.05,
        maxTotal: 0.3,
      },
    },
  },
  "shotguns.platformGrid": {
    timeScale: {
      expand: 0.85,
      collapse: 0.6,
    },
  },
  "shotguns.triggerExplainer": {
    timeScale: {
      expand: 0.85,
      collapse: 0.6,
    },
    text: {
      enableCharReveal: false,
    },
  },
  "bespoke.buildStepsScroller": {
    text: {
      enableCharReveal: false,
    },
    stagger: {
      expand: {
        items: 0.04,
        maxTotal: 0.2,
      },
    },
  },
  "experience.visitFactory": {
    timeScale: {
      expand: 0.85,
      collapse: 0.6,
    },
    hover: {
      enabled: false,
    },
  },
  "experience.bookingOptions": {
    timeScale: {
      expand: 0.85,
      collapse: 0.6,
    },
    stagger: {
      expand: {
        items: 0.05,
        maxTotal: 0.3,
      },
    },
  },
};
const SECTION_INTERACTIONS: InteractionOverrideMap = {
  "shotguns.triggerExplainer": {
    hoverTease: false,
  },
  "bespoke.buildStepsScroller": {
    hoverTease: false,
  },
  "experience.visitFactory": {
    hoverTease: false,
  },
  "experience.bookingOptions": {
    hoverTease: false,
  },
};

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
