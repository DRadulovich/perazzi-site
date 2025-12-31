"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { homeMotion } from "@/lib/motionConfig";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Container, Heading, Section, Text } from "@/components/ui";

type ExperienceAdvisorySectionProps = Readonly<{
  sectionId: string;
  headingId: string;
  heading: string;
  intro: string;
  chatLabel: string;
  chatPayload: ChatTriggerPayload;
  link: { href: string; label: string };
  rightTitle: string;
  bullets: readonly string[];
  closing: string;
}>;

const MotionSection = motion(Section);

export function ExperienceAdvisorySection({
  sectionId,
  headingId,
  heading,
  intro,
  chatLabel,
  chatPayload,
  link,
  rightTitle,
  bullets,
  closing,
}: ExperienceAdvisorySectionProps) {
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
      id={sectionId}
      padding="lg"
      bordered={false}
      className="relative isolate w-screen max-w-[100vw] scroll-mt-24 overflow-hidden rounded-none! border-t border-none! bg-canvas shadow-none! full-bleed"
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

          <motion.div variants={item}>
            <Text className="mb-8 type-subsection text-ink-muted" leading="relaxed">
              {intro}
            </Text>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap justify-start gap-3">
            <ChatTriggerButton
              label={chatLabel}
              payload={chatPayload}
              variant="outline"
            />
            <Link
              href={link.href}
              className="type-button inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-perazzi-red/60 px-4 py-2 text-perazzi-red transition hover:border-perazzi-red hover:text-perazzi-red hover:translate-x-0.5 focus-ring"
            >
              {link.label}
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
            <Text className="text-ink">
              {rightTitle}
            </Text>
          </motion.div>

          <motion.ul className="space-y-2" variants={list}>
            {bullets.map((bullet) => {
              const [label, ...rest] = bullet.split(" - ");
              return (
                <motion.li
                  key={bullet}
                  variants={item}
                  whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
                >
                  <span className="text-ink">{label}</span>
                  {rest.length ? (
                    <>
                      {" "}-{" "}
                      {rest.join(" - ")}
                    </>
                  ) : null}
                </motion.li>
              );
            })}
          </motion.ul>

          <motion.div variants={item}>
            <Text className="text-ink-muted" leading="relaxed">
              {closing}
            </Text>
          </motion.div>
        </motion.div>
      </Container>
    </MotionSection>
  );
}

