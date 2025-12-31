"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Container, Heading, Section, Text } from "@/components/ui";
import { homeMotion } from "@/lib/motionConfig";
import type { HomeData, HomeGuidePlatform } from "@/types/content";

type HomeGuideSectionProps = Readonly<{
  guideSection: HomeData["guideSection"];
  guidePlatforms: readonly HomeGuidePlatform[];
}>;

const MotionSection = motion(Section);

export function HomeGuideSection({ guideSection, guidePlatforms }: HomeGuideSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;

  const leftColumn = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.12 : 0 },
    },
  } as const;

  const rightColumn = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.08 : 0, delayChildren: motionEnabled ? 0.08 : 0 },
    },
  } as const;

  const list = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.06 : 0,
        delayChildren: motionEnabled ? 0.05 : 0,
      },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  return (
    <MotionSection
      padding="lg"
      bordered={false}
      className="rounded-none border-t border-none! bg-canvas shadow-none!"
      aria-labelledby="home-guide-heading"
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
          variants={leftColumn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <motion.div variants={item}>
            <Heading
              id="home-guide-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {guideSection.title ?? "Need a guide?"}
            </Heading>
          </motion.div>
          <motion.div variants={item}>
            <Text className="mb-8 type-subsection text-ink-muted">
              {guideSection.intro
                ?? "Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond."}
            </Text>
          </motion.div>
          <motion.div variants={item} className="flex flex-wrap gap-3 justify-start">
            <ChatTriggerButton
              label={guideSection.chatLabel ?? "Ask about platforms"}
              payload={{
                question:
                  guideSection.chatPrompt
                  ?? "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
                context: { pageUrl: "/" },
              }}
              variant="outline"
            />
            <Link
              href={guideSection.linkHref ?? "/shotguns"}
              className="type-button inline-flex items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
            >
              {guideSection.linkLabel ?? "Explore shotguns"}
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="space-y-3 type-subsection text-ink-muted"
          variants={rightColumn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
        >
          <motion.div variants={item}>
            <Text className="text-ink" leading="normal">
              Three starting points most Perazzi shooters choose:
            </Text>
          </motion.div>
          <motion.ul className="space-y-2" variants={list}>
            {guidePlatforms.map((platform) => (
              <motion.li
                key={platform.code}
                variants={item}
                whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
              >
                <span className="text-ink">{platform.name ?? platform.code?.toUpperCase()}</span>
                {" "}–{" "}
                {platform.description ?? ""}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div variants={item}>
            <Text className="text-ink-muted">
              {guideSection.closing
                ?? "The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit."}
            </Text>
          </motion.div>
        </motion.div>
      </Container>
    </MotionSection>
  );
}
