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
