"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { JourneyOverviewData } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type JourneyOverviewProps = {
  journey: JourneyOverviewData;
};

export function JourneyOverview({ journey }: JourneyOverviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const analyticsRef = useAnalyticsObserver<HTMLElement>("JourneyOverviewSeen");

  return (
    <motion.section
      ref={analyticsRef}
      data-analytics-id="JourneyOverviewSeen"
      className="rounded-2xl border border-border/60 bg-card/10 px-4 py-6 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8"
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
        <div
          className="prose prose-sm max-w-none leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: journey.introHtml }}
        />
        <nav aria-label="Journey steps">
          <ol className="grid gap-2 sm:grid-cols-2">
            {journey.steps.map((step) => (
              <li key={step.id}>
                <a
                  href={step.href}
                  className="group inline-flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/10 px-4 py-3 text-sm font-semibold text-ink focus-ring transition-colors hover:border-perazzi-red/60 sm:border-border/70 sm:bg-card/60"
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
        <div
          className="text-[11px] sm:text-xs leading-relaxed text-ink-muted"
          dangerouslySetInnerHTML={{ __html: journey.disclaimerHtml }}
        />
      </div>
    </motion.section>
  );
}
