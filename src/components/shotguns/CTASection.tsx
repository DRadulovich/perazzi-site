"use client";

import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { motion, useReducedMotion } from "framer-motion";
import { logAnalytics } from "@/lib/analytics";

type CTASectionProps = {
  readonly text: string;
  readonly primary: { readonly label: string; readonly href: string };
  readonly secondary?: { readonly label: string; readonly href: string };
  readonly dataAnalyticsId?: string;
  readonly analyticsPrefix?: string;
};

export function CTASection({
  text,
  primary,
  secondary,
  dataAnalyticsId = "ShotgunsCTA",
  analyticsPrefix,
}: CTASectionProps) {
  const analyticsRef = useAnalyticsObserver(dataAnalyticsId);
  const prefersReducedMotion = useReducedMotion();

  const logClick = (type: "primary" | "secondary") => {
    logAnalytics(`FinalCTAClicked:${type}`);
    if (analyticsPrefix) {
      logAnalytics(`${analyticsPrefix}:${type}`);
    }
  };

  return (
    <motion.section
      ref={analyticsRef}
      data-analytics-id={dataAnalyticsId}
      className="rounded-2xl bg-perazzi-black px-4 py-8 text-white sm:rounded-3xl sm:px-6 sm:py-10 sm:shadow-md"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      aria-labelledby="shotguns-cta-heading"
    >
      <div className="space-y-6">
        <h2
          id="shotguns-cta-heading"
          className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white"
        >
          Begin your fitting
        </h2>
        <p className="max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-white/80">
          {text}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            asChild
            variant="primary"
            size="lg"
            onClick={() => logClick("primary")}
          >
            <a href={primary.href}>{primary.label}</a>
          </Button>
          {secondary ? (
            <Button
              asChild
              variant="secondary"
              size="lg"
              onClick={() => logClick("secondary")}
            >
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
