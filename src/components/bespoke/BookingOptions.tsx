"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import type { BuildPageData, BookingOption, WhatToExpectItem } from "@/types/build";

type BookingOptionsProps = {
  booking: BuildPageData["booking"];
};

type BookingOptionCardProps = {
  option: BookingOption;
};

function BookingOptionCard({ option }: BookingOptionCardProps) {
  const optionRef = useAnalyticsObserver(`BookingOptionSeen:${option.id}`);

  return (
    <article
      ref={optionRef}
      data-analytics-id={`BookingOptionSeen:${option.id}`}
      className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-ink">{option.title}</h3>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {option.durationMins} minutes
        </p>
        <div
          className="prose prose-base max-w-none text-ink-muted md:prose-lg"
          dangerouslySetInnerHTML={{ __html: option.descriptionHtml }}
        />
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

type WhatToExpectProps = {
  item: WhatToExpectItem;
  defaultOpen: boolean;
  reducedMotion: boolean;
};

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
    <Collapsible.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        logAnalytics(
          `WhatToExpectToggle:${item.id}:${next ? "open" : "close"}`,
        );
      }}
    >
      <Collapsible.Trigger
        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-semibold text-ink focus-ring md:px-6 md:py-4 md:text-base lg:px-7 lg:py-5"
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
      </Collapsible.Trigger>
      <Collapsible.Content
        id={contentId}
        className={cn(
          "overflow-hidden px-4 pt-3 text-sm text-ink-muted md:px-6 md:pt-4 md:text-base lg:px-7 lg:pt-5",
          reducedMotion
            ? "transition-none"
            : "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        )}
      >
        <div
          className="prose prose-base max-w-none pb-4 text-ink-muted md:prose-lg lg:pb-5"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

const scheduler = {
  title: "Perazzi Bespoke Scheduler",
  src: "https://calendly.com/perazzi/bespoke-fitting",
  fallback: "https://calendly.com/perazzi/bespoke-fitting",
};

export function BookingOptions({ booking }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("BookingOptionsSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)") ?? false;
  const prefersReducedMotion = useReducedMotion();
  const [showScheduler, setShowScheduler] = useState(false);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="BookingOptionsSeen"
      className="space-y-6"
      aria-labelledby="booking-options-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Reserve time
        </p>
        <h2
          id="booking-options-heading"
          className="text-2xl font-semibold text-ink"
        >
          {booking.headline}
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {booking.options.map((option) => (
          <BookingOptionCard key={option.id} option={option} />
        ))}
      </div>
      <aside
        aria-label="What to expect during your fitting"
        className="space-y-3 rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm md:space-y-4 md:p-8 lg:space-y-5 lg:p-10"
      >
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-muted">
          What to expect
        </h3>
        <div className="space-y-3 md:space-y-4 lg:space-y-5">
          {booking.whatToExpect.map((item) => (
            <WhatToExpectCollapsible
              key={item.id}
              item={item}
              defaultOpen={isDesktop}
              reducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </aside>
      <div className="space-y-3 rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm md:space-y-4 md:p-8 lg:space-y-5 lg:p-10">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Schedule with the concierge
        </h3>
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
        <p className="text-xs text-ink-muted">
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
      </div>
      {booking.note ? (
        <p className="text-xs text-ink-muted">{booking.note}</p>
      ) : null}
    </section>
  );
}
