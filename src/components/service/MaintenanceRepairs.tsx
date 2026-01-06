"use client";

import SafeHtml from "@/components/SafeHtml";
import { useState } from "react";
import type { GuideDownload, MaintenanceSection } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Section, Text } from "@/components/ui";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";

type MaintenanceRepairsProps = {
  readonly maintenanceSection: MaintenanceSection;
  readonly guide?: GuideDownload;
};

const MotionSection = motion(Section);

type GuideLinkProps = {
  readonly guide?: GuideDownload;
  readonly motionEnabled: boolean;
};

type BeforeSendChecklistProps = {
  readonly label: string;
  readonly motionEnabled: boolean;
};

const getMotionProps = (enabled: boolean, props: MotionProps): MotionProps => {
  if (enabled) {
    return props;
  }

  return { initial: false };
};

function GuideLink({ guide, motionEnabled }: GuideLinkProps) {
  if (!guide) {
    return null;
  }

  const linkMotionProps = getMotionProps(motionEnabled, {
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.6 },
    transition: homeMotion.micro,
  });

  return (
    <motion.a
      href={guide.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 type-button text-perazzi-red transition hover:translate-x-0.5 focus-ring"
      onClick={() => logAnalytics(`GuideDownload:${guide.id}`)}
      {...linkMotionProps}
    >
      Download {guide.title}
      {guide.fileSize ? (
        <span className="type-caption text-ink-muted">({guide.fileSize})</span>
      ) : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </motion.a>
  );
}

function BeforeSendChecklist({ label, motionEnabled }: BeforeSendChecklistProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/10 px-4 py-3 text-left type-nav text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/40 focus-ring sm:border-border sm:bg-card/40"
        aria-expanded={open}
        aria-controls="before-send-content"
      >
        <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
        {label}
        <span
          aria-hidden="true"
          className={cn(
            "text-lg",
            motionEnabled ? "transition-transform" : "transition-none",
            open ? "rotate-45" : "rotate-0",
          )}
        >
          +
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        id="before-send-content"
        className={cn(
          "mt-3 rounded-2xl border border-border/60 bg-card/40 p-4 type-body-sm text-ink-muted sm:bg-card/60",
          motionEnabled ? undefined : "data-[state=closed]:animate-none data-[state=open]:animate-none",
        )}
      >
        <ul className="list-disc pl-5">
          <li>Record the serial number and trigger group number.</li>
          <li>Remove aftermarket accessories that could be damaged.</li>
          <li>Use the Perazzi travel case or double-box with foam.</li>
          <li>Include a note describing issues, desired break weight, and timeline.</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MaintenanceRepairs({ maintenanceSection, guide }: MaintenanceRepairsProps) {
  const analyticsRef = useAnalyticsObserver("MaintenanceRepairsSeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const heading = maintenanceSection.heading ?? "Maintenance & repairs";
  const subheading = maintenanceSection.subheading ?? "How we service your Perazzi";
  const overviewHtml = maintenanceSection.overviewHtml ?? "";
  const beforeSendLabel = maintenanceSection.columnLabels?.[0] ?? "Before you send your gun";
  const sectionMotionProps = getMotionProps(motionEnabled, {
    initial: { opacity: 0, y: 24, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, amount: 0.35 },
    transition: homeMotion.reveal,
  });
  const headingMotionProps = getMotionProps(motionEnabled, {
    initial: { opacity: 0, y: 14, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, amount: 0.6 },
    transition: homeMotion.revealFast,
  });

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="MaintenanceRepairsSeen"
      padding="md"
      className="group relative space-y-4 overflow-hidden"
      aria-labelledby="maintenance-heading"
      {...sectionMotionProps}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-2"
        {...headingMotionProps}
      >
        <Heading id="maintenance-heading" level={2} className="type-section text-ink">
          {heading}
        </Heading>
        <Text className="type-section-subtitle text-ink-muted">
          {subheading}
        </Text>
      </motion.div>
      <SafeHtml
        className="prose prose-sm max-w-none leading-relaxed text-ink-muted md:prose-lg"
        html={overviewHtml}
      />
      <GuideLink guide={guide} motionEnabled={motionEnabled} />
      <BeforeSendChecklist label={beforeSendLabel} motionEnabled={motionEnabled} />
    </MotionSection>
  );
}
