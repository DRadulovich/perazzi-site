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

const cinematicEase = [0.16, 1, 0.3, 1] as const;

export const homeMotion = {
  cinematicEase,
  reveal: {
    duration: 0.8,
    ease: cinematicEase,
  },
  revealFast: {
    duration: 0.55,
    ease: cinematicEase,
  },
  micro: {
    duration: 0.22,
    ease: "easeOut" as const,
  },
  springHighlight: {
    type: "spring" as const,
    stiffness: 260,
    damping: 30,
    mass: 0.7,
  },
};
