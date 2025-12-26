"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Heading, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import type { BuildPageData, BookingOption, WhatToExpectItem } from "@/types/build";

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
      className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:p-6"
    >
      <div className="space-y-2">
        <Heading level={3} size="sm" className="text-ink">
          {option.title}
        </Heading>
        <Text size="xs" muted className="font-semibold">
          {option.durationLabel ?? (option.durationMins ? `${option.durationMins} minutes` : "")}
        </Text>
        <div className="prose prose-base max-w-none leading-relaxed text-ink-muted md:prose-lg">
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {option.descriptionHtml}
          </ReactMarkdown>
        </div>
      </div>
      <div className="mt-auto pt-6">
        <Button
          asChild
          variant="secondary"
          size="lg"
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
        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-left text-sm font-semibold text-ink shadow-sm backdrop-blur-sm focus-ring md:px-6 md:py-4 md:text-base lg:px-7 lg:py-5"
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
          "overflow-hidden px-4 pt-3 text-sm text-ink-muted md:px-6 md:pt-4 md:text-base lg:px-7 lg:pt-5",
          reducedMotion
            ? "transition-none"
            : "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        )}
      >
        <div className="prose prose-base max-w-none pb-4 leading-relaxed text-ink-muted md:prose-lg lg:pb-5">
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {item.bodyHtml}
          </ReactMarkdown>
        </div>
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
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [showScheduler, setShowScheduler] = useState(false);

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
      <div className="space-y-2">
        <Text size="xs" muted className="font-semibold">
          Reserve time
        </Text>
        <Heading id="booking-options-heading" level={2} size="xl" className="text-ink">
          {resolvedHeading}
        </Heading>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {resolvedOptions.map((option) => (
          <BookingOptionCard key={option.id} option={option} />
        ))}
      </div>
      <aside
        aria-label="What to expect during your fitting"
        className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm md:space-y-4 md:p-8 md:rounded-3xl md:bg-card/75 lg:space-y-5 lg:p-10"
      >
        <Text size="xs" muted className="font-semibold">
          {resolvedWhatToExpectHeading}
        </Text>
        <div className="space-y-3 md:space-y-4 lg:space-y-5">
          {resolvedWhatToExpect.map((item) => (
            <WhatToExpectCollapsible
              key={item.id}
              item={item}
              defaultOpen={isDesktop}
              reducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </aside>
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm md:space-y-4 md:p-8 md:rounded-3xl md:bg-card/75 lg:space-y-5 lg:p-10">
        <Text size="xs" muted className="font-semibold">
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
        <Text asChild size="xs" className="text-ink-muted" leading="normal">
          <p>
            Prefer email?{" "}
            <a
              href={scheduler.fallback}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-perazzi-red focus-ring"
            >
              Open the request form<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </Text>
      </div>
      {resolvedNote ? (
        <Text size="xs" className="text-ink-muted" leading="normal">
          {resolvedNote}
        </Text>
      ) : null}
    </section>
  );
}
