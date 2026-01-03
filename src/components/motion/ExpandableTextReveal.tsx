"use client";

import { motion, type Variants } from "framer-motion";

import {
  COLLAPSE_TIME_SCALE,
  EASE_CINEMATIC,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
} from "@/motion/expandableSectionMotion";
import { shouldUseLetterReveal, splitTextForReveal } from "@/motion/textReveal";

type ExpandableTextRevealProps = {
  text: string;
  reduceMotion: boolean;
  maxChars?: number;
};

const toSeconds = (ms: number) => ms / 1000;

const letterVariants: Variants = {
  collapsed: { opacity: 0 },
  prezoom: { opacity: 0 },
  expanded: {
    opacity: 1,
    transition: {
      duration: toSeconds(EXPANDED_HEADER_REVEAL_MS) * EXPAND_TIME_SCALE,
      ease: EASE_CINEMATIC,
    },
  },
  closingHold: {
    opacity: 0,
    transition: {
      duration: toSeconds(EXPANDED_HEADER_REVEAL_MS) * COLLAPSE_TIME_SCALE,
      ease: EASE_CINEMATIC,
    },
  },
};

export function ExpandableTextReveal({
  text,
  reduceMotion,
  maxChars,
}: ExpandableTextRevealProps) {
  if (!shouldUseLetterReveal(text, reduceMotion, maxChars)) {
    return <>{text}</>;
  }

  const { srText, units } = splitTextForReveal(text, "letters");

  return (
    <>
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true">
        {units.map((unit) => (
          <motion.span key={unit.key} variants={letterVariants} className="inline-block">
            {unit.isWhitespace ? "\u00A0" : unit.value}
          </motion.span>
        ))}
      </span>
    </>
  );
}
