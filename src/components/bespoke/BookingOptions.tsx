"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import type { BuildPageData, BookingOption, WhatToExpectItem } from "@/types/build";
import SafeHtml from "@/components/SafeHtml";
import { homeMotion } from "@/lib/motionConfig";

type BookingOptionsProps = Readonly<{
  booking: BuildPageData["booking"];
  bookingSection?: BuildPageData["bookingSection"];
}>;

type BookingOptionCardProps = Readonly<{
  option: BookingOption;
}>;

function BookingOptionCard({ option }: BookingOptionCardProps) {
  const optionRef = useAnalyticsObserver(`BookingOptionSeen:${option.id}`);

  return (
    <article
      ref={optionRef}
      data-analytics-id={`BookingOptionSeen:${option.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      <div className="space-y-2">
        <Heading level={3} size="sm" className="type-body-title text-ink">
          {option.title}
        </Heading>
        <Text size="caption" muted>
          {option.durationLabel ?? (option.durationMins ? `${option.durationMins} minutes` : "")}
        </Text>
        <SafeHtml
          className="max-w-none type-body text-ink-muted"
          html={option.descriptionHtml}
        />
      </div>
      <div className="mt-auto pt-6">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="md:!type-button-lg md:!px-xl md:!py-sm"
          onClick={() => {
            logAnalytics(`BookingClicked:${option.id}`);
          }}
        >
          <a href={option.href}>Begin Your Fitting</a>
        </Button>
      </div>
    </article>
  );
}

type WhatToExpectProps = Readonly<{
  item: WhatToExpectItem;
  defaultOpen: boolean;
  reducedMotion: boolean;
}>;

function WhatToExpectCollapsible({
  item,
  defaultOpen,
  reducedMotion,
}: WhatToExpectProps) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);
  const contentId = `what-to-expect-${item.id}`;

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        logAnalytics(
          `WhatToExpectToggle:${item.id}:${next ? "open" : "close"}`,
        );
      }}
    >
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-left type-body-title text-ink italic shadow-soft backdrop-blur-sm focus-ring md:px-6 md:py-4 lg:px-7 lg:py-5"
        aria-controls={contentId}
        aria-expanded={open}
      >
        {item.title}
        <span
          aria-hidden="true"
          className={cn(
            "transition-transform duration-200",
            open ? "rotate-45" : "rotate-0",
          )}
        >
          +
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        id={contentId}
        className={cn(
          "overflow-hidden px-4 pt-3 type-body-sm text-ink-muted md:px-6 md:pt-4 lg:px-7 lg:pt-5",
          reducedMotion
            ? "transition-none"
            : "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        )}
      >
        <SafeHtml
          className="prose prose-base max-w-none pb-4 leading-relaxed text-ink-muted md:prose-lg lg:pb-5"
          html={item.bodyHtml}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

const scheduler = {
  title: "Perazzi Bespoke Scheduler",
  src: "https://calendly.com/perazzi/bespoke-fitting",
  fallback: "https://calendly.com/perazzi/bespoke-fitting",
};

export function BookingOptions({ booking, bookingSection }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("BookingOptionsSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)") ?? false;
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;

  const grid = {
    hidden: {},
    show: {
      transition: { staggerChildren: motionEnabled ? 0.08 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const resolvedHeading = bookingSection?.heading ?? booking.headline;
  const resolvedOptions = bookingSection?.options?.length
    ? bookingSection.options.map((option, index) => {
        const fallback = booking.options[index];
        return {
          id: fallback?.id ?? `booking-${index}`,
          title: option.title ?? fallback?.title ?? "Booking option",
          durationLabel: option.duration ?? fallback?.durationLabel ??
            (fallback?.durationMins ? `${fallback.durationMins} minutes` : undefined),
          durationMins: fallback?.durationMins,
          descriptionHtml:
            option.description ?? fallback?.descriptionHtml ?? "",
          href: option.href ?? fallback?.href ?? "#",
        } satisfies BookingOption;
      })
    : booking.options;

  const resolvedWhatToExpectHeading =
    bookingSection?.whatToExpectHeading ?? booking.whatToExpectHeading ?? "What to expect";

  const resolvedWhatToExpect = bookingSection?.whatToExpectItems?.length
    ? bookingSection.whatToExpectItems.map((item, index) => {
        const fallback = booking.whatToExpect[index];
        return {
          id: fallback?.id ?? `expect-${index}`,
          title: fallback?.title ?? `What to expect ${index + 1}`,
          bodyHtml: item ?? fallback?.bodyHtml ?? "",
        } satisfies WhatToExpectItem;
      })
    : booking.whatToExpect;

  const resolvedNote = bookingSection?.note ?? booking.note;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="BookingOptionsSeen"
      className="space-y-6"
      aria-labelledby="booking-options-heading"
    >
      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Text size="label-tight" muted>
          Reserve time
        </Text>
        <Heading id="booking-options-heading" level={2} size="xl" className="text-ink">
          {resolvedHeading}
        </Heading>
      </motion.div>

      <motion.div
        className="grid gap-6 md:grid-cols-3"
        variants={grid}
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.4 } : undefined}
      >
        {resolvedOptions.map((option) => (
          <motion.div key={option.id} variants={item}>
            <BookingOptionCard option={option} />
          </motion.div>
        ))}
      </motion.div>

      <motion.aside
        aria-label="What to expect during your fitting"
        className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm md:space-y-4 md:p-8 md:rounded-3xl md:bg-card/75 lg:space-y-5 lg:p-10"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Text size="label-tight" muted>
          {resolvedWhatToExpectHeading}
        </Text>
        <div className="space-y-3 md:space-y-4 lg:space-y-5">
          {resolvedWhatToExpect.map((item) => (
            <WhatToExpectCollapsible
              key={item.id}
              item={item}
              defaultOpen={isDesktop}
              reducedMotion={reduceMotion}
            />
          ))}
        </div>
      </motion.aside>

      <motion.div
        className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm md:space-y-4 md:p-8 md:rounded-3xl md:bg-card/75 lg:space-y-5 lg:p-10"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Text size="label-tight" muted>
          Schedule with the concierge
        </Text>
        {showScheduler ? (
          <iframe
            src={scheduler.src}
            title={scheduler.title}
            className="h-[480px] w-full rounded-2xl border border-border"
            loading="lazy"
          />
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setShowScheduler(true);
              logAnalytics("BookingSchedulerOpen");
            }}
          >
            Load scheduler
          </Button>
        )}
        <Text asChild size="sm" className="text-ink-muted">
          <p>
            Prefer email?{" "}
            <a
              href={scheduler.fallback}
              target="_blank"
              rel="noreferrer"
              className="text-perazzi-red focus-ring"
            >
              Open the request form<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </Text>
      </motion.div>

      {resolvedNote ? (
        <motion.div
          initial={motionEnabled ? { opacity: 0, y: 10, filter: "blur(10px)" } : false}
          whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          viewport={motionEnabled ? { once: true, amount: 0.4 } : undefined}
          transition={motionEnabled ? homeMotion.revealFast : undefined}
        >
          <Text size="caption" className="text-ink-muted">
            {resolvedNote}
          </Text>
        </motion.div>
      ) : null}
    </section>
  );
}
