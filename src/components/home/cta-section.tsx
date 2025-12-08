"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { HomeData } from "@/types/content";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type CTASectionProps = {
  readonly finale: HomeData["finale"];
};

export function CTASection({ finale }: CTASectionProps) {
  const analyticsRef = useAnalyticsObserver("FinalCTASeen");
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Align SSR/CSR markup, then respect reduced motion after hydration.
  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;

  return (
    <motion.section
      ref={analyticsRef}
      data-analytics-id="FinalCTASeen"
      className="rounded-2xl bg-perazzi-black px-4 py-8 text-white sm:px-8 sm:py-10"
      initial={motionEnabled ? { opacity: 0, y: 30 } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      aria-labelledby="final-cta-heading"
    >
      <div className="space-y-6">
        <h2
          id="final-cta-heading"
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-white"
        >
          Join the legacy
        </h2>
        <p className="max-w-none text-sm sm:text-base leading-relaxed text-white/80 md:max-w-4xl lg:max-w-4xl">
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
