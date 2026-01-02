import type { Transition } from "framer-motion";

const cinematicEase = [0.16, 1, 0.3, 1] as const;
const revealSlow = { duration: 2.0, ease: cinematicEase };
const reveal = { duration: 0.8, ease: cinematicEase };
const revealFast = { duration: 0.55, ease: cinematicEase };
const collapse = { duration: 1.05, ease: cinematicEase };
const micro = { duration: 0.22, ease: "easeOut" as const };
const staggerShort = 0.08;
const staggerLong = 0.16;
const sectionHeader = {
  stagger: staggerLong,
  bodyDelay: 0.24,
  readMoreDelayAfterHeader: 0.2,
  readMoreDelayAfterBody: 0.1,
} as const;

export const heritageMotion = {
  railSpring: {
    type: "spring" as const,
    stiffness: 120,
    damping: 24,
    mass: 0.8,
  },
  slideEmphasisSpring: {
    type: "spring" as const,
    stiffness: 140,
    damping: 24,
    mass: 0.9,
  },
  quickFade: {
    duration: 0.18,
    ease: "easeOut" as const,
  },
};

export const homeMotion = {
  cinematicEase,
  revealSlow,
  reveal,
  revealFast,
  collapse,
  micro,
  staggerShort,
  staggerLong,
  sectionHeader,
  springHighlight: {
    type: "spring" as const,
    stiffness: 260,
    damping: 30,
    mass: 0.7,
  },
};

type HeadingVariantOptions = {
  motionEnabled: boolean;
  transition?: Transition;
  stagger?: number;
  offset?: number;
  blur?: number;
};

export const getSectionHeadingVariants = ({
  motionEnabled,
  transition = reveal,
  stagger = sectionHeader.stagger,
  offset = 14,
  blur = 10,
}: HeadingVariantOptions) => ({
  headingContainer: {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? stagger : 0 } },
  },
  headingItem: {
    hidden: { y: offset, filter: `blur(${blur}px)` },
    show: { y: 0, filter: "blur(0px)", transition },
  },
} as const);
