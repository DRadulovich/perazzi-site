"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { JourneyOverviewData } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Section } from "@/components/ui";
import SafeHtml from "@/components/SafeHtml";

type JourneyOverviewProps = Readonly<{
  journey: JourneyOverviewData;
}>;

const MotionSection = motion(Section);

export function JourneyOverview({ journey }: JourneyOverviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const analyticsRef = useAnalyticsObserver<HTMLElement>("JourneyOverviewSeen");

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="JourneyOverviewSeen"
      padding="md"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-labelledby="journey-overview-heading"
    >
      <div className="space-y-4">
        <h2 id="journey-overview-heading" className="sr-only">
          Journey overview
        </h2>
        <SafeHtml
          className="prose prose-sm max-w-none leading-relaxed text-ink"
          html={journey.introHtml}
        />
        <nav aria-label="Journey steps">
          <ol className="grid gap-2 sm:grid-cols-2">
            {journey.steps.map((step) => (
              <li key={step.id}>
                <a
                  href={step.href}
                  className="group inline-flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm font-semibold text-ink shadow-soft backdrop-blur-sm transition-colors hover:border-perazzi-red/40 hover:bg-card/85 focus-ring"
                >
                  <span>{step.label}</span>
                  <span
                    aria-hidden="true"
                    className="text-perazzi-red transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <SafeHtml
          className="text-[11px] sm:text-xs leading-relaxed text-ink-muted"
          html={journey.disclaimerHtml}
        />
      </div>
    </MotionSection>
  );
}
