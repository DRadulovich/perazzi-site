"use client";

import { Heading, Section, Text } from "@/components/ui";
import type { ServiceOverviewSection } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import SafeHtml from "@/components/SafeHtml";
import { motion, useReducedMotion } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";

type ServiceOverviewProps = {
  readonly overview: ServiceOverviewSection;
};

const MotionSection = motion(Section);

export function ServiceOverview({ overview }: ServiceOverviewProps) {
  const analyticsRef = useAnalyticsObserver("ServiceOverviewSeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const heading = overview.heading ?? "Overview";
  const subheading = overview.subheading ?? "Factory-level care, wherever you are";
  const checksHeading = overview.checksHeading ?? "Standard checks";
  const hasCustomChecksHtml = Boolean(overview.checksHtml);
  const checksList = hasCustomChecksHtml ? [] : overview.checks ?? [];

  let checksContent: React.ReactNode = null;
  if (hasCustomChecksHtml) {
    checksContent = (
      <SafeHtml
        className="prose max-w-none type-section-subtitle text-ink text-2xl"
        html={overview.checksHtml ?? ""}
      />
    );
  } else if (checksList.length) {
    checksContent = (
      <ul className="list-disc pl-5 type-section-subtitle text-ink text-2xl">
        {checksList.map((item) => (
          <li key={typeof item === "string" ? item : JSON.stringify(item)} className="marker:text-ink-muted">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="ServiceOverviewSeen"
      padding="md"
      className="group grid gap-6 overflow-hidden lg:grid-cols-[1.2fr_1fr]"
      aria-labelledby="service-overview-heading"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-4"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Heading id="service-overview-heading" level={2} className="type-section text-ink">
          {heading}
        </Heading>
        <Text className="type-section-subtitle text-ink-muted">
          {subheading}
        </Text>
        <SafeHtml
          className="type-body max-w-none text-ink-muted"
          html={overview.introHtml}
        />
      </motion.div>

      <motion.div
        initial={motionEnabled ? { opacity: 0, y: 16, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.5 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Section padding="sm" className="relative overflow-hidden bg-card/75">
          <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
        <Text className="type-card-title text-ink-muted">
          {checksHeading}
        </Text>
        {checksContent}
        </Section>
      </motion.div>
    </MotionSection>
  );
}
