"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { homeMotion } from "@/lib/motionConfig";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Container, Heading, Section, Text } from "@/components/ui";

type AdvisoryBullet =
  | { key: string; text: string }
  | { key: string; label: string; description?: string };

type ShotgunsAdvisorySectionProps = Readonly<{
  headingId: string;
  eyebrow?: string;
  heading: string;
  introParagraphs: readonly string[];
  chatLabel: string;
  chatPayload: ChatTriggerPayload;
  link?: { label: string; href: string };
  rightTitle: string;
  bullets: readonly AdvisoryBullet[];
  closing: string;
}>;

const MotionSection = motion(Section);

export function ShotgunsAdvisorySection({
  headingId,
  eyebrow,
  heading,
  introParagraphs,
  chatLabel,
  chatPayload,
  link,
  rightTitle,
  bullets,
  closing,
}: ShotgunsAdvisorySectionProps) {
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

  return (
    <MotionSection
      padding="lg"
      bordered={false}
      className="rounded-none border-t border-none! bg-canvas shadow-none!"
      aria-labelledby={headingId}
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
          {eyebrow ? (
            <motion.div variants={item}>
              <Text size="label-tight" className="text-ink-muted">
                {eyebrow}
              </Text>
            </motion.div>
          ) : null}

          <motion.div variants={item}>
            <Heading
              id={headingId}
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
          </motion.div>

          <motion.div variants={item} className="mb-6 space-y-4 lg:mb-10">
            {introParagraphs.map((paragraph) => (
              <Text key={paragraph} className="prose-journal text-ink-muted">
                {paragraph}
              </Text>
            ))}
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap gap-3 justify-start">
            <ChatTriggerButton
              label={chatLabel}
              variant="outline"
              payload={chatPayload}
            />
            {link ? (
              <Link
                href={link.href}
                className="type-button inline-flex items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
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
              {rightTitle}
            </Text>
          </motion.div>

          <motion.ul className="space-y-2" variants={list}>
            {bullets.map((bullet) => (
              <motion.li
                key={bullet.key}
                variants={item}
                whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
              >
                {"text" in bullet ? (
                  bullet.text
                ) : (
                  <>
                    <span className="text-ink">{bullet.label}</span>
                    {" "}–{" "}
                    {bullet.description ?? ""}
                  </>
                )}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div variants={item}>
            <Text className="text-ink-muted">
              {closing}
            </Text>
          </motion.div>
        </motion.div>
      </Container>
    </MotionSection>
  );
}

