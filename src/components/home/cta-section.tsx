"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { HomeData } from "@/types/content";
import { Button, Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";

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

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.12 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="FinalCTASeen"
      padding="md"
      bordered={false}
      className="mt-12 md:mt-16 bg-canvas text-ink"
      initial={motionEnabled ? { opacity: 0, y: 30 } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.6 }}
      transition={motionEnabled ? homeMotion.reveal : undefined}
      aria-labelledby="final-cta-heading"
    >
      <motion.div
        className="space-y-6"
        variants={content}
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.7 } : undefined}
      >
        <motion.div variants={item}>
          <Heading
            id="final-cta-heading"
            level={2}
            size="xl"
            className="text-ink"
          >
            Join the legacy
          </Heading>
        </motion.div>
        <motion.div variants={item}>
          <Text className="type-section-subtitle max-w-none text-ink/80 md:max-w-4xl lg:max-w-4xl">
            {finale.text}
          </Text>
        </motion.div>
        <motion.div variants={item} className="flex flex-wrap gap-4">
          <Button
            asChild
            variant="primary"
            size="sm"
            className="md:!type-button-lg md:px-xl! md:py-sm!"
            onClick={() => logAnalytics("FinalCTAClicked:primary")}
          >
            <a href={finale.ctaPrimary.href}>{finale.ctaPrimary.label}</a>
          </Button>
          {finale.ctaSecondary ? (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="md:!type-button-lg md:px-xl! md:py-sm!"
              onClick={() => logAnalytics("FinalCTAClicked:secondary")}
            >
              <a href={finale.ctaSecondary.href}>{finale.ctaSecondary.label}</a>
            </Button>
          ) : null}
        </motion.div>
      </motion.div>
    </MotionSection>
  );
}
