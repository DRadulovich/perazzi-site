"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HomeData } from "@/types/content";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type CTASectionProps = {
  finale: HomeData["finale"];
};

export function CTASection({ finale }: CTASectionProps) {
  const analyticsRef = useAnalyticsObserver("FinalCTASeen");
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      ref={analyticsRef}
      data-analytics-id="FinalCTASeen"
      className="rounded-2xl bg-perazzi-black px-6 py-10 text-white sm:px-10"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      aria-labelledby="final-cta-heading"
    >
      <div className="space-y-6">
        <h2
          id="final-cta-heading"
          className="text-2xl font-semibold tracking-tight text-white"
        >
          Join the legacy
        </h2>
        <p className="max-w-none text-lg leading-relaxed text-white/80 md:max-w-3xl lg:max-w-4xl">
          {finale.text}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            asChild
            variant="primary"
            size="lg"
            onClick={() => logAnalytics("FinalCTAClicked:primary")}
          >
            <a href={finale.ctaPrimary.href}>{finale.ctaPrimary.label}</a>
          </Button>
          {finale.ctaSecondary ? (
            <Button
              asChild
              variant="secondary"
              size="lg"
              onClick={() => logAnalytics("FinalCTAClicked:secondary")}
            >
              <a href={finale.ctaSecondary.href}>{finale.ctaSecondary.label}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
