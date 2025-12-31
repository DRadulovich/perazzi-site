"use client";

import type { GuidesSection } from "@/types/service";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { motion, useReducedMotion } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";

type CareGuidesDownloadsProps = Readonly<{
  guidesSection: GuidesSection;
}>;

const MotionSection = motion(Section);

export function CareGuidesDownloads({ guidesSection }: CareGuidesDownloadsProps) {
  const analyticsRef = useAnalyticsObserver("CareGuidesSeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const heading = guidesSection.heading ?? "Downloads & checklists";
  const careGuidesLabel = guidesSection.careGuidesLabel ?? "Care guides";
  const downloadButtonLabel = guidesSection.downloadButtonLabel ?? "Download";
  const downloadsLabel = guidesSection.downloadsLabel;
  const guides = guidesSection.guides;

  if (!guides.length) return null;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="CareGuidesSeen"
      padding="md"
      className="group relative space-y-6 overflow-hidden"
      aria-labelledby="care-guides-heading"
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
        <Text size="label-tight" muted>
          {careGuidesLabel}
        </Text>
        <Heading id="care-guides-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
        {downloadsLabel ? (
          <Text size="md" muted leading="relaxed">
            {downloadsLabel}
          </Text>
        ) : null}
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
        {guides.map((guide) => (
          <motion.li
            key={guide.id}
            className="group relative overflow-hidden rounded-2xl border border-border/75 bg-card/75 p-4 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85"
            variants={{
              hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
            }}
            whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
          >
            <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
            <Heading level={3} size="md" className="text-ink">
              {guide.title}
            </Heading>
            <SafeHtml
              className="type-body-sm text-ink-muted"
              html={guide.summaryHtml}
            />
            <a
              href={guide.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 type-button text-perazzi-red transition hover:translate-x-0.5 focus-ring"
              onClick={() => logAnalytics(`GuideDownload:${guide.id}`)}
            >
              {downloadButtonLabel}
              {guide.fileSize ? (
                <span className="type-caption text-ink-muted">
                  ({guide.fileSize})
                </span>
              ) : null}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </MotionSection>
  );
}
