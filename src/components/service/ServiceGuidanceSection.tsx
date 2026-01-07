"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { homeMotion } from "@/lib/motionConfig";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Section, Text } from "@/components/ui";

type ServiceGuidanceSectionProps = Readonly<{
  analyticsId: string;
  headingId: string;
  eyebrow: string;
  body: string;
  chatLabel: string;
  chatPayload: ChatTriggerPayload;
}>;

const MotionSection = motion.create(Section);

export function ServiceGuidanceSection({
  analyticsId,
  headingId,
  eyebrow,
  body,
  chatLabel,
  chatPayload,
}: ServiceGuidanceSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const analyticsRef = useAnalyticsObserver<HTMLElement>(analyticsId);

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id={analyticsId}
      padding="md"
      className="group relative overflow-hidden"
      aria-labelledby={headingId}
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-4"
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        variants={{ hidden: {}, show: { transition: { staggerChildren: motionEnabled ? 0.08 : 0 } } }}
      >
        <motion.div variants={item}>
          <Text asChild size="label-tight" muted>
            <h2 id={headingId}>
              {eyebrow}
            </h2>
          </Text>
        </motion.div>

        <motion.div variants={item}>
          <Text className="type-body text-ink-muted" size="md" leading="relaxed">
            {body}
          </Text>
        </motion.div>

        <motion.div variants={item}>
          <ChatTriggerButton label={chatLabel} payload={chatPayload} />
        </motion.div>
      </motion.div>
    </MotionSection>
  );
}

