"use client";

import { useEffect, useState } from "react";
import SafeHtml from "@/components/SafeHtml";
import type { FAQItem } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Section, Text } from "@/components/ui";
import { motion, useReducedMotion } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";

type FAQListProps = Readonly<{
  items: readonly FAQItem[];
  heading?: string;
  intro?: string;
}>;

const MotionSection = motion.create(Section);

export function FAQList({ items, heading, intro }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver("ServiceFAQSeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  if (!items.length) return null;

  const title = heading ?? "Service questions";
  const lead = intro;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="ServiceFAQSeen"
      padding="md"
      className="group relative space-y-6 overflow-hidden"
      aria-labelledby="service-faq-heading"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Text size="label-tight" muted>
          FAQ
        </Text>
        <Heading id="service-faq-heading" level={2} size="xl" className="text-ink">
          {title}
        </Heading>
        {lead ? (
          <Text size="md" muted leading="relaxed">
            {lead}
          </Text>
        ) : null}
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
        }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.q}
            variants={{
              hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
            }}
          >
            <FAQItemCard item={item} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </MotionSection>
  );
}

function FAQItemCard({
  item,
  index,
}: Readonly<{ item: FAQItem; index: number }>) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  useEffect(() => {
    if (open) {
      logAnalytics(`FAQViewed:${index}`);
    }
  }, [open, index]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group relative overflow-hidden rounded-2xl border border-border/75 bg-card/75 p-4 shadow-soft backdrop-blur-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-perazzi-red">
        <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
        <CollapsibleTrigger
          className="flex w-full items-center justify-between text-left type-nav text-ink focus-ring"
          aria-expanded={open}
        >
          {item.q}
          <span
            aria-hidden="true"
            className={cn(
              "text-lg",
              motionEnabled ? "transition-transform" : "transition-none",
              open ? "rotate-45" : "rotate-0",
            )}
          >
            +
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            motionEnabled ? undefined : "data-[state=closed]:animate-none data-[state=open]:animate-none",
          )}
        >
          <SafeHtml
            className={cn("mt-2 type-body-sm text-ink-muted")}
            html={item.aHtml}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
