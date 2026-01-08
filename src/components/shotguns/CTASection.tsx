"use client";

import { Button, Heading, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import { useSiteSettings } from "@/components/site-settings-context";

type CTASectionProps = {
  readonly heading?: string;
  readonly text: string;
  readonly primary: { readonly label: string; readonly href: string };
  readonly secondary?: { readonly label: string; readonly href: string };
  readonly dataAnalyticsId?: string;
  readonly analyticsPrefix?: string;
};

const MotionSection = motion.create(Section);

export function CTASection({
  heading,
  text,
  primary,
  secondary,
  dataAnalyticsId = "ShotgunsCTA",
  analyticsPrefix,
}: CTASectionProps) {
  const analyticsRef = useAnalyticsObserver(dataAnalyticsId);
  const { ctaDefaults } = useSiteSettings();
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;

  const logClick = (type: "primary" | "secondary") => {
    logAnalytics(`FinalCTAClicked:${type}`);
    if (analyticsPrefix) {
      logAnalytics(`${analyticsPrefix}:${type}`);
    }
  };

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
      data-analytics-id={dataAnalyticsId}
      padding="md"
      bordered={false}
      className="mt-12 md:mt-16 bg-canvas text-ink"
      initial={motionEnabled ? { opacity: 0, y: 30 } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
      aria-labelledby="shotguns-cta-heading"
    >
      <motion.div
        className="space-y-6"
        variants={content}
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.7 } : undefined}
      >
        <motion.div variants={item}>
          <Heading id="shotguns-cta-heading" level={2} size="xl" className="text-ink">
            {heading ?? ctaDefaults?.heading ?? "Begin your fitting"}
          </Heading>
        </motion.div>
        <motion.div variants={item}>
          <Text className="type-section-subtitle max-w-2xl text-ink/80">
            {text}
          </Text>
        </motion.div>
        <motion.div variants={item} className="flex flex-wrap gap-4">
          <Button
            asChild
            variant="primary"
            size="sm"
            className="md:!type-button-lg md:px-xl! md:py-sm!"
            onClick={() => { logClick("primary"); }}
          >
            <a href={primary.href}>{primary.label}</a>
          </Button>
          {secondary ? (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="md:!type-button-lg md:px-xl! md:py-sm!"
              onClick={() => { logClick("secondary"); }}
            >
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : null}
        </motion.div>
      </motion.div>
    </MotionSection>
  );
}
