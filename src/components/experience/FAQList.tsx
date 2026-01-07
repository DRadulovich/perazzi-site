"use client";

import { useEffect, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MotionProps, Variants } from "framer-motion";
import Image from "next/image";
import type { FAQItem } from "@/types/experience";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import { faq as faqFixture } from "@/content/experience/faq";
import SafeHtml from "@/components/SafeHtml";
import { homeMotion } from "@/lib/motionConfig";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Container, Heading, Section, Text } from "@/components/ui";

type FAQListProps = Readonly<{
  items: FAQItem[];
  embedded?: boolean;
  heading?: string;
  lead?: string;
}>;

type FAQMotionConfig = Readonly<{
  headerProps: MotionProps;
  listProps: MotionProps;
  sectionProps: MotionProps;
  itemVariants: Variants;
}>;

type FAQContentProps = Readonly<{
  items: FAQItem[];
  title: string;
  subtitle: string;
  motionConfig: FAQMotionConfig;
}>;

type FAQSectionProps = Readonly<{
  embedded: boolean;
  analyticsRef: RefObject<HTMLElement | null>;
  motionConfig: FAQMotionConfig;
  children: ReactNode;
}>;

const MotionSection = motion.create(Section);

function resolveFAQItems(items: FAQItem[]) {
  return items.length ? items : faqFixture;
}

function buildFAQMotionConfig(prefersReducedMotion: boolean): FAQMotionConfig {
  const motionEnabled = !prefersReducedMotion;

  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: motionEnabled ? 0.08 : 0 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  };

  const headerProps: MotionProps = motionEnabled
    ? {
        initial: { opacity: 0, y: 14, filter: "blur(10px)" },
        whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
        viewport: { once: true, amount: 0.6 },
        transition: homeMotion.revealFast,
      }
    : { initial: false };

  const listProps: MotionProps = motionEnabled
    ? {
        variants: listVariants,
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, amount: 0.35 },
      }
    : {
        variants: listVariants,
        initial: false,
      };

  const sectionProps: MotionProps = motionEnabled
    ? {
        initial: { opacity: 0, y: 24, filter: "blur(10px)" },
        whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
        viewport: { once: true, amount: 0.35 },
        transition: homeMotion.reveal,
      }
    : { initial: false };

  return {
    headerProps,
    listProps,
    sectionProps,
    itemVariants,
  };
}

function FAQContent({ items, title, subtitle, motionConfig }: FAQContentProps) {
  return (
    <>
      <motion.div className="space-y-2" {...motionConfig.headerProps}>
        <Heading
          id="experience-faq-heading"
          level={2}
          size="xl"
          className="text-ink"
        >
          {title}
        </Heading>
        <Text size="md" className="type-section-subtitle text-ink-muted" leading="relaxed">
          {subtitle}
        </Text>
      </motion.div>
      <motion.div className="space-y-4" {...motionConfig.listProps}>
        {items.map((item, index) => (
          <motion.div key={item.q} variants={motionConfig.itemVariants}>
            <FAQItemCard item={item} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

function FAQSection({ embedded, analyticsRef, motionConfig, children }: FAQSectionProps) {
  if (embedded) {
    return (
      <MotionSection
        ref={analyticsRef}
        data-analytics-id="ExperienceFAQSeen"
        padding="md"
        className="space-y-6"
        aria-labelledby="experience-faq-heading"
        {...motionConfig.sectionProps}
      >
        {children}
      </MotionSection>
    );
  }

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperienceFAQSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="experience-faq-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/experience/pweb-experience-faq-bg.jpg"
          alt="Perazzi experience FAQ background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-(--scrim-soft)"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <MotionSection
          padding="md"
          className="space-y-6 bg-card/40"
          {...motionConfig.sectionProps}
        >
          {children}
        </MotionSection>
      </Container>
    </section>
  );
}

export function FAQList({ items, embedded = false, heading, lead }: FAQListProps) {
  const analyticsRef = useAnalyticsObserver<HTMLElement>("ExperienceFAQSeen");
  const prefersReducedMotion = useReducedMotion();

  const faqItems = resolveFAQItems(items);

  if (!faqItems.length) return null;

  const title = heading ?? "FAQ";
  const subtitle = lead ?? "Questions from future owners";
  const motionConfig = buildFAQMotionConfig(Boolean(prefersReducedMotion));

  return (
    <FAQSection embedded={embedded} analyticsRef={analyticsRef} motionConfig={motionConfig}>
      <FAQContent items={faqItems} title={title} subtitle={subtitle} motionConfig={motionConfig} />
    </FAQSection>
  );
}

type FAQItemCardProps = Readonly<{
  item: FAQItem;
  index: number;
}>;

function FAQItemCard({ item, index }: FAQItemCardProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      logAnalytics(`FAQViewed:${index}`);
    }
  }, [open, index]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left type-card-title text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80"
        aria-expanded={open}
      >
        {item.q}
        <span
          aria-hidden="true"
          className={cn(
            "text-lg transition-transform",
            open ? "rotate-45" : "rotate-0",
          )}
        >
          +
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 type-card-body text-ink-muted shadow-soft backdrop-blur-sm sm:bg-card/80">
        <SafeHtml
          className="max-w-none type-card-body text-ink-muted"
          html={item.aHtml}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
