"use client";

import type { PartsEditorialSection } from "@/types/service";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { motion, useReducedMotion } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";

type PartsEditorialProps = Readonly<{
  partsEditorialSection: PartsEditorialSection;
}>;

const MotionSection = motion.create(Section);

export function PartsEditorial({ partsEditorialSection }: PartsEditorialProps) {
  const analyticsRef = useAnalyticsObserver("PartsEditorialSeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const heading = partsEditorialSection.heading ?? "Parts guidance";
  const intro = partsEditorialSection.intro ?? "Genuine components, fitted correctly";
  const parts = partsEditorialSection.parts;

  if (!parts.length) return null;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="PartsEditorialSeen"
      padding="md"
      className="group relative space-y-6 overflow-hidden"
      aria-labelledby="parts-editorial-heading"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Heading id="parts-editorial-heading" level={2} className="type-section text-ink">
          {heading}
        </Heading>
        <Text className="type-section-subtitle text-ink-muted">
          {intro}
        </Text>
      </motion.div>

      <motion.ul
        className="space-y-4"
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
        }}
      >
        {parts.map((part) => (
          <motion.li
            key={part.name}
            className="group relative overflow-hidden rounded-2xl border border-border/75 bg-card/75 p-4 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85"
            variants={{
              hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
            }}
            whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
          >
            <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Heading level={3} className="type-card-title text-ink">
                {part.name}
              </Heading>
              <Text className={cn("type-button whitespace-nowrap", "text-ink-muted")}>
                Fitment: {part.fitment}
              </Text>
            </div>
            <Text size="md" muted>
              {part.purpose}
            </Text>
            {part.notesHtml ? (
              <SafeHtml
                className="mt-2 type-body-sm text-ink-muted"
                html={part.notesHtml}
              />
            ) : null}
          </motion.li>
        ))}
      </motion.ul>
    </MotionSection>
  );
}
