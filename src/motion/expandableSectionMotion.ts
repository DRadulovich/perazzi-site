// Shared timing/easing/stagger knobs for the expandable section motion system.
// Keep this file constants-only so all consumers stay side-effect free.

export const EXPAND_TIME_SCALE = 1;
export const COLLAPSE_TIME_SCALE = EXPAND_TIME_SCALE * 0.5;

export const PREZOOM_MS = 180;
export const CONTAINER_EXPAND_MS = 820;
export const SCRIM_CONVERGE_MS = 820;
export const GLASS_REVEAL_MS = 550;
export const EXPANDED_HEADER_REVEAL_MS = 550;
export const MAIN_VISUAL_REVEAL_MS = 550;
export const META_REVEAL_MS = 550;
export const CONTENT_REVEAL_MS = 550;
export const LIST_REVEAL_MS = 550;
export const CTA_REVEAL_MS = 550;

export const STAGGER_HEADER_ITEMS_MS = 120;
export const STAGGER_BODY_ITEMS_MS = 100;
export const STAGGER_LIST_ITEMS_MS = 120;
export const STAGGER_LETTERS_MS = 15;

export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;
export const EASE_SOFT = "easeInOut" as const;
export const EASE_MICRO_OUT = "easeOut" as const;

export const HIGHLIGHT_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.7,
};
