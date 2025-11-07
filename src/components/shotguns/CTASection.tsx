 "use client";

import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { motion, useReducedMotion } from "framer-motion";

type CTASectionProps = {
  text: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  dataAnalyticsId?: string;
  analyticsPrefix?: string;
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

  const logClick = (type: "primary" | "secondary", label: string) => {
    if (analyticsPrefix) {
      console.log(`[analytics] ${analyticsPrefix}:${type}`);
    } else {
      console.log(`[analytics] CTA:${type}:${label}`);
    }
  };

  return (
    <motion.section
      ref={analyticsRef}
      data-analytics-id={dataAnalyticsId}
      className="rounded-3xl bg-perazzi-black px-6 py-10 text-white sm:px-10"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      aria-labelledby="shotguns-cta-heading"
    >
      <div className="space-y-6">
        <h2
          id="shotguns-cta-heading"
          className="text-2xl font-semibold tracking-tight text-white"
        >
          Begin your fitting
        </h2>
        <p className="max-w-2xl text-lg leading-relaxed text-white/80">
          {text}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            asChild
            variant="primary"
            size="lg"
            className="bg-white text-perazzi-black hover:bg-white/90 focus-visible:bg-white"
            onClick={() => logClick("primary", primary.label)}
          >
            <a href={primary.href}>{primary.label}</a>
          </Button>
          {secondary ? (
            <Button
              asChild
              variant="secondary"
              size="lg"
              onClick={() => logClick("secondary", secondary.label)}
            >
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
