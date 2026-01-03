import type { Transition, Variants } from "framer-motion";

import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  CONTENT_REVEAL_MS,
  COLLAPSE_CONTENT_DELAY_MS,
  COLLAPSE_CTA_DELAY_MS,
  COLLAPSE_GLASS_DELAY_MS,
  COLLAPSE_HEADER_DELAY_MS,
  CTA_REVEAL_MS,
  EASE_CINEMATIC,
  EASE_SOFT,
  EXPAND_CONTENT_DELAY_MS,
  EXPAND_CTA_DELAY_MS,
  EXPAND_GLASS_DELAY_MS,
  EXPAND_HEADER_DELAY_MS,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
  GLASS_REVEAL_MS,
  MAIN_VISUAL_REVEAL_MS,
  META_REVEAL_MS,
  PREZOOM_MS,
  SCRIM_CONVERGE_MS,
  SCRIM_FADE_OFFSET_MS,
  SCRIM_FOCUS_OFFSET_MS,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";

export type ExpandableSectionPhase =
  | "collapsed"
  | "prezoom"
  | "expanded"
  | "closingHold";

export type ExpandableSectionMotionMode = "full" | "reduced";
export type ExpandableSectionScrimMode = "atmosphere" | "dualFocusFade";

export type ExpandableSectionVariants = {
  background: Variants;
  scrimTop: Variants;
  scrimBottom: Variants;
  collapsedHeader: Variants;
  glass: Variants;
  expandedHeader: Variants;
  mainVisual: Variants;
  meta: Variants;
  content: Variants;
  ctaRow: Variants;
};

export type ExpandableSectionVariantOptions = {
  motionMode?: ExpandableSectionMotionMode;
  scrimMode?: ExpandableSectionScrimMode;
  backgroundScale?: {
    collapsed?: number;
    prezoom?: number;
    expanded?: number;
  };
  parallaxY?: number;
  scrimOffsetY?: number;
  itemOffsetY?: number;
  blurPx?: number;
  glassScale?: number;
};

const toSeconds = (ms: number) => ms / 1000;

const expandTransition = (ms: number, ease: Transition["ease"] = EASE_CINEMATIC): Transition => ({
  duration: toSeconds(ms) * EXPAND_TIME_SCALE,
  ease,
});

const collapseTransition = (ms: number, ease: Transition["ease"] = EASE_CINEMATIC): Transition => ({
  duration: toSeconds(ms) * COLLAPSE_TIME_SCALE,
  ease,
});

const applyStagger = (
  transition: Transition,
  staggerMs: number | undefined,
  reducedMotion: boolean,
  scale: number,
  staggerDirection?: 1 | -1
): Transition => {
  if (reducedMotion || !staggerMs) return transition;
  return {
    ...transition,
    staggerChildren: toSeconds(staggerMs) * scale,
    staggerDirection,
  };
};

const applyDelay = (
  transition: Transition,
  delayMs: number | undefined,
  reducedMotion: boolean,
  scale = 1
): Transition => {
  if (reducedMotion || !delayMs) return transition;
  return {
    ...transition,
    delay: toSeconds(delayMs) * scale,
  };
};

export function createExpandableSectionVariants(
  options: ExpandableSectionVariantOptions = {}
): ExpandableSectionVariants {
  const motionMode = options.motionMode ?? "full";
  const scrimMode = options.scrimMode ?? "atmosphere";
  const reducedMotion = motionMode === "reduced";

  const itemOffsetY = reducedMotion ? 0 : (options.itemOffsetY ?? 14);
  const blurPx = reducedMotion ? 0 : (options.blurPx ?? 10);
  const scrimOffsetY =
    reducedMotion ? 0 : (options.scrimOffsetY ?? (scrimMode === "dualFocusFade" ? 0 : 24));
  const glassScale = reducedMotion ? 1 : (options.glassScale ?? 0.985);
  const parallaxY = reducedMotion ? 0 : (options.parallaxY ?? 0);

  const backgroundScale = {
    collapsed: reducedMotion ? 1 : (options.backgroundScale?.collapsed ?? 1.32),
    prezoom: reducedMotion ? 1 : (options.backgroundScale?.prezoom ?? 1.12),
    expanded: options.backgroundScale?.expanded ?? 1,
  };

  const hiddenItem: Record<string, number | string> = { opacity: 0 };
  if (itemOffsetY) hiddenItem.y = itemOffsetY;
  if (blurPx) hiddenItem.filter = `blur(${blurPx}px)`;

  const visibleItem: Record<string, number | string> = { opacity: 1 };
  if (itemOffsetY) visibleItem.y = 0;
  if (blurPx) visibleItem.filter = "blur(0px)";

  const collapsedGlass: Record<string, number | string> = {
    opacity: 1,
    scale: glassScale,
  };
  const expandedGlass: Record<string, number | string> = {
    opacity: 1,
    scale: 1,
  };

  const scrimHiddenTop: Record<string, number | string> = { opacity: 0 };
  if (scrimOffsetY) scrimHiddenTop.y = -scrimOffsetY;
  const scrimHiddenBottom: Record<string, number | string> = { opacity: 0 };
  if (scrimOffsetY) scrimHiddenBottom.y = scrimOffsetY;
  const scrimVisible: Record<string, number | string> = { opacity: 1, y: 0 };

  const backgroundTransition = expandTransition(CONTAINER_EXPAND_MS);
  const backgroundCollapse = collapseTransition(CONTAINER_EXPAND_MS);
  const scrimExpand = expandTransition(SCRIM_CONVERGE_MS, EASE_SOFT);
  const scrimCollapse = collapseTransition(SCRIM_CONVERGE_MS, EASE_SOFT);
  const scrimFadeExpand = applyDelay(scrimExpand, SCRIM_FADE_OFFSET_MS, reducedMotion);
  const scrimFocusExpand = applyDelay(scrimExpand, SCRIM_FOCUS_OFFSET_MS, reducedMotion);
  const scrimTopVariants =
    scrimMode === "dualFocusFade"
      ? {
          collapsed: {
            ...scrimVisible,
            transition: scrimCollapse,
          },
          prezoom: {
            ...scrimVisible,
            transition: scrimExpand,
          },
          expanded: {
            ...scrimHiddenTop,
            transition: scrimFadeExpand,
          },
          closingHold: {
            ...scrimVisible,
            transition: scrimCollapse,
          },
        }
      : {
          collapsed: {
            ...scrimHiddenTop,
            transition: scrimCollapse,
          },
          prezoom: {
            ...scrimHiddenTop,
            transition: scrimExpand,
          },
          expanded: {
            ...scrimVisible,
            transition: scrimExpand,
          },
          closingHold: {
            ...scrimHiddenTop,
            transition: scrimCollapse,
          },
        };
  const scrimBottomVariants =
    scrimMode === "dualFocusFade"
      ? {
          collapsed: {
            ...scrimHiddenBottom,
            transition: scrimCollapse,
          },
          prezoom: {
            ...scrimHiddenBottom,
            transition: scrimExpand,
          },
          expanded: {
            ...scrimVisible,
            transition: scrimFocusExpand,
          },
          closingHold: {
            ...scrimHiddenBottom,
            transition: scrimCollapse,
          },
        }
      : {
          collapsed: {
            ...scrimHiddenBottom,
            transition: scrimCollapse,
          },
          prezoom: {
            ...scrimHiddenBottom,
            transition: scrimExpand,
          },
          expanded: {
            ...scrimVisible,
            transition: scrimExpand,
          },
          closingHold: {
            ...scrimHiddenBottom,
            transition: scrimCollapse,
          },
        };

  return {
    background: {
      collapsed: {
        scale: backgroundScale.collapsed,
        y: parallaxY,
        transition: backgroundCollapse,
      },
      prezoom: {
        scale: backgroundScale.prezoom,
        y: parallaxY,
        transition: expandTransition(PREZOOM_MS),
      },
      expanded: {
        scale: backgroundScale.expanded,
        y: 0,
        transition: backgroundTransition,
      },
      closingHold: {
        scale: backgroundScale.collapsed,
        y: parallaxY,
        transition: backgroundCollapse,
      },
    },
    scrimTop: scrimTopVariants,
    scrimBottom: scrimBottomVariants,
    collapsedHeader: {
      collapsed: {
        ...visibleItem,
        transition: applyStagger(
          collapseTransition(EXPANDED_HEADER_REVEAL_MS),
          STAGGER_HEADER_ITEMS_MS,
          reducedMotion,
          COLLAPSE_TIME_SCALE
        ),
      },
      prezoom: {
        ...visibleItem,
        transition: expandTransition(EXPANDED_HEADER_REVEAL_MS),
      },
      expanded: {
        ...hiddenItem,
        transition: expandTransition(EXPANDED_HEADER_REVEAL_MS),
      },
      closingHold: {
        ...hiddenItem,
        transition: collapseTransition(EXPANDED_HEADER_REVEAL_MS),
      },
    },
    glass: {
      collapsed: {
        ...collapsedGlass,
        transition: collapseTransition(GLASS_REVEAL_MS),
      },
      prezoom: {
        ...collapsedGlass,
        transition: expandTransition(GLASS_REVEAL_MS),
      },
      expanded: {
        ...expandedGlass,
        transition: applyDelay(
          expandTransition(GLASS_REVEAL_MS),
          EXPAND_GLASS_DELAY_MS,
          reducedMotion,
          EXPAND_TIME_SCALE
        ),
      },
      closingHold: {
        ...collapsedGlass,
        transition: applyDelay(
          collapseTransition(GLASS_REVEAL_MS),
          COLLAPSE_GLASS_DELAY_MS,
          reducedMotion,
          COLLAPSE_TIME_SCALE
        ),
      },
    },
    expandedHeader: {
      collapsed: {
        ...hiddenItem,
        transition: collapseTransition(EXPANDED_HEADER_REVEAL_MS),
      },
      prezoom: {
        ...hiddenItem,
        transition: expandTransition(EXPANDED_HEADER_REVEAL_MS),
      },
      expanded: {
        ...visibleItem,
        transition: applyDelay(
          applyStagger(
            expandTransition(EXPANDED_HEADER_REVEAL_MS),
            STAGGER_HEADER_ITEMS_MS,
            reducedMotion,
            EXPAND_TIME_SCALE
          ),
          EXPAND_HEADER_DELAY_MS,
          reducedMotion,
          EXPAND_TIME_SCALE
        ),
      },
      closingHold: {
        ...hiddenItem,
        transition: applyDelay(
          applyStagger(
            collapseTransition(EXPANDED_HEADER_REVEAL_MS),
            STAGGER_HEADER_ITEMS_MS,
            reducedMotion,
            COLLAPSE_TIME_SCALE,
            -1
          ),
          COLLAPSE_HEADER_DELAY_MS,
          reducedMotion,
          COLLAPSE_TIME_SCALE
        ),
      },
    },
    mainVisual: {
      collapsed: {
        ...hiddenItem,
        transition: collapseTransition(MAIN_VISUAL_REVEAL_MS),
      },
      prezoom: {
        ...hiddenItem,
        transition: expandTransition(MAIN_VISUAL_REVEAL_MS),
      },
      expanded: {
        ...visibleItem,
        transition: expandTransition(MAIN_VISUAL_REVEAL_MS),
      },
      closingHold: {
        ...hiddenItem,
        transition: collapseTransition(MAIN_VISUAL_REVEAL_MS),
      },
    },
    meta: {
      collapsed: {
        ...hiddenItem,
        transition: collapseTransition(META_REVEAL_MS),
      },
      prezoom: {
        ...hiddenItem,
        transition: expandTransition(META_REVEAL_MS),
      },
      expanded: {
        ...visibleItem,
        transition: applyDelay(
          applyStagger(
            expandTransition(META_REVEAL_MS),
            STAGGER_BODY_ITEMS_MS,
            reducedMotion,
            EXPAND_TIME_SCALE
          ),
          EXPAND_CONTENT_DELAY_MS,
          reducedMotion,
          EXPAND_TIME_SCALE
        ),
      },
      closingHold: {
        ...hiddenItem,
        transition: applyDelay(
          applyStagger(
            collapseTransition(META_REVEAL_MS),
            STAGGER_BODY_ITEMS_MS,
            reducedMotion,
            COLLAPSE_TIME_SCALE,
            -1
          ),
          COLLAPSE_CONTENT_DELAY_MS,
          reducedMotion,
          COLLAPSE_TIME_SCALE
        ),
      },
    },
    content: {
      collapsed: {
        ...hiddenItem,
        transition: collapseTransition(CONTENT_REVEAL_MS),
      },
      prezoom: {
        ...hiddenItem,
        transition: expandTransition(CONTENT_REVEAL_MS),
      },
      expanded: {
        ...visibleItem,
        transition: applyDelay(
          applyStagger(
            expandTransition(CONTENT_REVEAL_MS),
            STAGGER_BODY_ITEMS_MS,
            reducedMotion,
            EXPAND_TIME_SCALE
          ),
          EXPAND_CONTENT_DELAY_MS,
          reducedMotion,
          EXPAND_TIME_SCALE
        ),
      },
      closingHold: {
        ...hiddenItem,
        transition: applyDelay(
          applyStagger(
            collapseTransition(CONTENT_REVEAL_MS),
            STAGGER_BODY_ITEMS_MS,
            reducedMotion,
            COLLAPSE_TIME_SCALE,
            -1
          ),
          COLLAPSE_CONTENT_DELAY_MS,
          reducedMotion,
          COLLAPSE_TIME_SCALE
        ),
      },
    },
    ctaRow: {
      collapsed: {
        ...hiddenItem,
        transition: collapseTransition(CTA_REVEAL_MS),
      },
      prezoom: {
        ...hiddenItem,
        transition: expandTransition(CTA_REVEAL_MS),
      },
      expanded: {
        ...visibleItem,
        transition: applyDelay(
          applyStagger(
            expandTransition(CTA_REVEAL_MS),
            STAGGER_LIST_ITEMS_MS,
            reducedMotion,
            EXPAND_TIME_SCALE
          ),
          EXPAND_CTA_DELAY_MS,
          reducedMotion,
          EXPAND_TIME_SCALE
        ),
      },
      closingHold: {
        ...hiddenItem,
        transition: applyDelay(
          applyStagger(
            collapseTransition(CTA_REVEAL_MS),
            STAGGER_LIST_ITEMS_MS,
            reducedMotion,
            COLLAPSE_TIME_SCALE,
            -1
          ),
          COLLAPSE_CTA_DELAY_MS,
          reducedMotion,
          COLLAPSE_TIME_SCALE
        ),
      },
    },
  };
}
