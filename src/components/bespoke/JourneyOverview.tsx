"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { JourneyOverviewData } from "@/types/build";

type JourneyOverviewProps = {
  journey: JourneyOverviewData;
};

export function JourneyOverview({ journey }: JourneyOverviewProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-labelledby="journey-overview-heading"
    >
      <div className="space-y-4">
        <div
          className="prose prose-sm max-w-none text-ink"
          dangerouslySetInnerHTML={{ __html: journey.introHtml }}
        />
        <nav aria-label="Journey steps">
          <ol className="grid gap-2 sm:grid-cols-2">
            {journey.steps.map((step) => (
              <li key={step.id}>
                <a
                  href={step.href}
                  className="group inline-flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm font-semibold text-ink focus-ring transition-colors hover:border-perazzi-red/60"
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
          className="text-xs text-ink-muted"
          dangerouslySetInnerHTML={{ __html: journey.disclaimerHtml }}
        />
      </div>
    </motion.section>
  );
}
