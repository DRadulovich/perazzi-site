"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { BuildPageData } from "@/types/build";
import { homeMotion } from "@/lib/motionConfig";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Container, Heading, Section, Text } from "@/components/ui";

type BespokeGuideSectionProps = Readonly<{
  guide?: BuildPageData["bespokeGuide"];
}>;

const MotionSection = motion(Section);
const DEFAULT_GUIDE_ITEMS = [
  "Fit & Dynamics — try-gun measurements, balance targets, and barrel regulation priorities.",
  "Platform & Wood — HT or MX lineage, fore-end/stock profiles, and wood blank options.",
  "Engraving & Finish — story direction, coverage, timelines, and hand-finish details.",
];

export function BespokeGuideSection({ guide }: BespokeGuideSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;

  const column = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.1 : 0 },
    },
  } as const;

  const list = {
    hidden: {},
    show: {
      transition: { staggerChildren: motionEnabled ? 0.06 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const heading = guide?.heading ?? "Need a bespoke guide?";
  const body =
    guide?.body
    ?? "Ask how fittings, platform choices, engraving, and finishing should flow for you—so your visit to the atelier is focused, confident, and personal.";
  const chatLabel = guide?.chatLabel ?? "Plan my bespoke visit";
  const chatPrompt =
    guide?.chatPrompt
    ?? "Map my bespoke Perazzi journey: what to expect at the fitting, how to choose platform and barrels, how engraving is staged, and what decisions I should prep before visiting the atelier.";
  const linkLabel = guide?.linkLabel ?? "Request a visit";
  const linkHref = guide?.linkHref ?? "/experience/visit";

  const parsedItems = useMemo(() => {
    const resolvedItems = guide?.listItems?.length ? guide.listItems : DEFAULT_GUIDE_ITEMS;

    return resolvedItems.map((text) => {
      const [label, ...rest] = text.split("—");
      return {
        key: text,
        label: label.trim(),
        description: rest.join("—").trim(),
      };
    });
  }, [guide?.listItems]);

  return (
    <MotionSection
      padding="lg"
      bordered={false}
      className="rounded-none border-t border-none! bg-canvas shadow-none!"
      aria-labelledby="bespoke-guide-heading"
      initial={motionEnabled ? { opacity: 0, y: 28, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <Container
        size="xl"
        className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
      >
        <motion.div
          className="space-y-4 text-ink"
          variants={column}
          initial={motionEnabled ? "hidden" : false}
          whileInView={motionEnabled ? "show" : undefined}
          viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        >
          <motion.div variants={item}>
            <Heading
              id="bespoke-guide-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
          </motion.div>

          <motion.div variants={item}>
            <Text className="mb-8 type-subsection text-ink-muted">
              {body}
            </Text>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap gap-3 justify-start">
            <ChatTriggerButton
              label={chatLabel}
              payload={{
                question: chatPrompt,
                context: { pageUrl: "/bespoke", mode: "prospect" },
              }}
              variant="outline"
            />
            <Link
              href={linkHref}
              className="type-button inline-flex items-center justify-center gap-2 pill border border-perazzi-red/60 text-perazzi-red transition hover:border-perazzi-red hover:text-perazzi-red hover:translate-x-0.5 focus-ring"
            >
              {linkLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="space-y-3 type-subsection text-ink-muted"
          variants={column}
          initial={motionEnabled ? "hidden" : false}
          whileInView={motionEnabled ? "show" : undefined}
          viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        >
          <motion.div variants={item}>
            <Text className="type-card-title text-ink text-2xl!" leading="normal">
              Three things we’ll map together:
            </Text>
          </motion.div>

          <motion.ul className="space-y-2" variants={list}>
            {parsedItems.map((parsed) => (
              <motion.li
                key={parsed.key}
                variants={item}
                whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
              >
                <span className="text-ink">{parsed.label}</span>
                {parsed.description ? ` — ${parsed.description}` : ""}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div variants={item}>
            <Text className="text-ink-muted">
              The concierge aligns your disciplines, aesthetic cues, and schedule so the atelier session runs smoothly.
            </Text>
          </motion.div>
        </motion.div>
      </Container>
    </MotionSection>
  );
}
