"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MotionProps } from "framer-motion";
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

type BookingSection = BuildPageData["bookingSection"];
type BookingSectionOption = NonNullable<NonNullable<BookingSection>["options"]>[number];

type MotionToggleProps = Pick<MotionProps, "initial" | "whileInView" | "viewport" | "transition">;

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
          className="md:!type-button-lg md:px-xl! md:py-sm!"
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

const DEFAULT_WHAT_TO_EXPECT_HEADING = "What to expect";

const bookingOptionItem = {
  hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
} as const;

const getGridVariants = (enabled: boolean) =>
  ({
    hidden: {},
    show: {
      transition: { staggerChildren: enabled ? 0.08 : 0 },
    },
  }) as const;

const getMotionProps = (enabled: boolean, config: MotionToggleProps): MotionToggleProps => {
  if (!enabled) {
    return { initial: false };
  }

  return config;
};

const resolveDurationLabel = (
  override: BookingSectionOption,
  fallback?: BookingOption,
): string | undefined => {
  if (override.duration != null) {
    return override.duration;
  }

  if (fallback?.durationLabel != null) {
    return fallback.durationLabel;
  }

  if (fallback?.durationMins) {
    return `${fallback.durationMins} minutes`;
  }

  return undefined;
};

const mergeBookingOption = (
  override: BookingSectionOption,
  fallback: BookingOption | undefined,
  index: number,
): BookingOption => ({
  id: fallback?.id ?? `booking-${index}`,
  title: override.title ?? fallback?.title ?? "Booking option",
  durationLabel: resolveDurationLabel(override, fallback),
  durationMins: fallback?.durationMins,
  descriptionHtml: override.description ?? fallback?.descriptionHtml ?? "",
  href: override.href ?? fallback?.href ?? "#",
});

const resolveBookingOptions = (
  booking: BuildPageData["booking"],
  bookingSection?: BookingSection,
): BookingOption[] => {
  const overrides = bookingSection?.options;
  if (!overrides?.length) {
    return booking.options;
  }

  return overrides.map((override, index) =>
    mergeBookingOption(override, booking.options[index], index),
  );
};

const resolveWhatToExpectHeading = (
  booking: BuildPageData["booking"],
  bookingSection?: BookingSection,
): string =>
  bookingSection?.whatToExpectHeading ??
  booking.whatToExpectHeading ??
  DEFAULT_WHAT_TO_EXPECT_HEADING;

const mergeWhatToExpectItem = (
  fallback: WhatToExpectItem | undefined,
  bodyHtml: string | undefined,
  index: number,
): WhatToExpectItem => ({
  id: fallback?.id ?? `expect-${index}`,
  title: fallback?.title ?? `What to expect ${index + 1}`,
  bodyHtml: bodyHtml ?? fallback?.bodyHtml ?? "",
});

const resolveWhatToExpectItems = (
  booking: BuildPageData["booking"],
  bookingSection?: BookingSection,
): WhatToExpectItem[] => {
  const overrides = bookingSection?.whatToExpectItems;
  if (!overrides?.length) {
    return booking.whatToExpect;
  }

  return overrides.map((bodyHtml, index) =>
    mergeWhatToExpectItem(booking.whatToExpect[index], bodyHtml, index),
  );
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
  const blurRevealBase = {
    initial: { opacity: 0, y: 14, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: homeMotion.revealFast,
  };
  const noteRevealBase = {
    initial: { opacity: 0, y: 10, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: homeMotion.revealFast,
  };
  const headingMotionProps = getMotionProps(motionEnabled, {
    ...blurRevealBase,
    viewport: { once: true, amount: 0.6 },
  });
  const gridMotionProps = getMotionProps(motionEnabled, {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount: 0.4 },
  });
  const asideMotionProps = getMotionProps(motionEnabled, {
    ...blurRevealBase,
    viewport: { once: true, amount: 0.35 },
  });
  const schedulerMotionProps = getMotionProps(motionEnabled, {
    ...blurRevealBase,
    viewport: { once: true, amount: 0.35 },
  });
  const noteMotionProps = getMotionProps(motionEnabled, {
    ...noteRevealBase,
    viewport: { once: true, amount: 0.4 },
  });
  const gridVariants = getGridVariants(motionEnabled);

  const resolvedHeading = bookingSection?.heading ?? booking.headline;
  const resolvedOptions = resolveBookingOptions(booking, bookingSection);
  const resolvedWhatToExpectHeading = resolveWhatToExpectHeading(booking, bookingSection);
  const resolvedWhatToExpect = resolveWhatToExpectItems(booking, bookingSection);
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
        {...headingMotionProps}
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
        variants={gridVariants}
        {...gridMotionProps}
      >
        {resolvedOptions.map((option) => (
          <motion.div key={option.id} variants={bookingOptionItem}>
            <BookingOptionCard option={option} />
          </motion.div>
        ))}
      </motion.div>

      <motion.aside
        aria-label="What to expect during your fitting"
        className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm md:space-y-4 md:p-8 md:rounded-3xl md:bg-card/75 lg:space-y-5 lg:p-10"
        {...asideMotionProps}
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
        {...schedulerMotionProps}
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
          {...noteMotionProps}
        >
          <Text size="caption" className="text-ink-muted">
            {resolvedNote}
          </Text>
        </motion.div>
      ) : null}
    </section>
  );
}
