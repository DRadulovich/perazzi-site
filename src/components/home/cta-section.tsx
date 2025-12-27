"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { HomeData } from "@/types/content";
import { Button, Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type CTASectionProps = {
  readonly finale: HomeData["finale"];
};

const MotionSection = motion(Section);

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
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="FinalCTASeen"
      padding="md"
      bordered={false}
      className="bg-perazzi-black text-ink"
      initial={motionEnabled ? { opacity: 0, y: 30 } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      aria-labelledby="final-cta-heading"
    >
      <div className="space-y-6">
        <Heading
          id="final-cta-heading"
          level={2}
          size="lg"
          className="text-2xl sm:text-3xl tracking-tight text-ink"
        >
          Join the legacy
        </Heading>
        <Text className="max-w-none text-ink/80 md:max-w-4xl lg:max-w-4xl">
          {finale.text}
        </Text>
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
    </MotionSection>
  );
}
