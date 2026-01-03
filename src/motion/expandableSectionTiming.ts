import {
  COLLAPSE_CONTENT_DELAY_MS,
  COLLAPSE_CTA_DELAY_MS,
  COLLAPSE_GLASS_DELAY_MS,
  COLLAPSE_HEADER_DELAY_MS,
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  CONTENT_REVEAL_MS,
  CTA_REVEAL_MS,
  DEFAULT_EXIT_STAGGER_BUFFER_MS,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
  GLASS_REVEAL_MS,
  LIST_REVEAL_MS,
  MAIN_VISUAL_REVEAL_MS,
  META_REVEAL_MS,
  PREZOOM_MS,
  SCRIM_CONVERGE_MS,
} from "@/motion/expandableSectionMotion";

const MAX_EXIT_DELAY_MS = Math.max(
  COLLAPSE_GLASS_DELAY_MS,
  COLLAPSE_HEADER_DELAY_MS,
  COLLAPSE_CONTENT_DELAY_MS,
  COLLAPSE_CTA_DELAY_MS,
);

export const DEFAULT_PREZOOM_MS = PREZOOM_MS * EXPAND_TIME_SCALE;

export const DEFAULT_CLOSING_HOLD_MS =
  (
    Math.max(
      CONTAINER_EXPAND_MS,
      SCRIM_CONVERGE_MS,
      GLASS_REVEAL_MS,
      EXPANDED_HEADER_REVEAL_MS,
      MAIN_VISUAL_REVEAL_MS,
      META_REVEAL_MS,
      CONTENT_REVEAL_MS,
      LIST_REVEAL_MS,
      CTA_REVEAL_MS,
    ) +
    DEFAULT_EXIT_STAGGER_BUFFER_MS +
    MAX_EXIT_DELAY_MS
  ) * COLLAPSE_TIME_SCALE;

type ExitHoldOptions = {
  itemCount: number;
  staggerMs: number;
  itemDurationMs?: number;
};

export const getExitHoldExtraMs = ({
  itemCount,
  staggerMs,
  itemDurationMs = LIST_REVEAL_MS,
}: ExitHoldOptions) => {
  if (itemCount <= 1) return 0;
  const total = itemDurationMs + (itemCount - 1) * staggerMs;
  const extra = Math.max(0, total - DEFAULT_EXIT_STAGGER_BUFFER_MS);
  return extra * COLLAPSE_TIME_SCALE;
};
