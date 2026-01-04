"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { Button, Container, Heading, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { BookingSection } from "@/types/experience";

type BookingOptionsProps = Readonly<{
  bookingSection: BookingSection;
}>;

type BookingOptionsRevealSectionProps = Readonly<{
  bookingSection: BookingSection;
  enableTitleReveal: boolean;
}>;

export function BookingOptions({ bookingSection }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("ExperienceBookingSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const bookingKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const options = bookingSection.options;

  if (!options.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperienceBookingSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="experience-booking-heading"
    >
      <BookingOptionsRevealSection
        key={bookingKey}
        bookingSection={bookingSection}
        enableTitleReveal={enableTitleReveal}
      />
    </section>
  );
}

const BookingOptionsRevealSection = ({
  bookingSection,
  enableTitleReveal,
}: BookingOptionsRevealSectionProps) => {
  const [bookingExpanded, setBookingExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerLoaded, setSchedulerLoaded] = useState(false);

  const bookingShellRef = useRef<HTMLDivElement | null>(null);

  const schedulerPanelId = "experience-scheduler-panel";
  const schedulerNoteId = "experience-scheduler-note";
  const options = bookingSection.options;
  const scheduler = bookingSection.scheduler;
  const heading = bookingSection.heading ?? "Book a fitting";
  const subheading = bookingSection.subheading ?? "Choose the session that fits your journey";
  const optionCtaLabel = bookingSection.optionCtaLabel ?? "Reserve this session";

  const revealBooking = !enableTitleReveal || bookingExpanded;
  const revealPhotoFocus = revealBooking;
  const bookingMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;

  const handleBookingExpand = () => {
    if (!enableTitleReveal) return;
    setBookingExpanded(true);
    setHeaderThemeReady(true);
  };

  const handleBookingCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setBookingExpanded(false);
  };

  const handleSchedulerToggle = () => {
    setSchedulerOpen((prev) => {
      const next = !prev;
      if (next && !schedulerLoaded) {
        setSchedulerLoaded(true);
      }
      logAnalytics(`ExperienceScheduler:${next ? "open" : "close"}`);
      return next;
    });
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealBooking) return;
    const node = bookingShellRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enableTitleReveal, revealBooking, schedulerOpen, schedulerLoaded, options.length]);

  return (
    <>
      <BookingBackground revealBooking={revealBooking} revealPhotoFocus={revealPhotoFocus} />

      <Container size="xl" className="relative z-10">
        <div
          ref={bookingShellRef}
          style={
            enableTitleReveal && revealBooking && expandedHeight
              ? { minHeight: expandedHeight }
              : undefined
          }
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            bookingMinHeight,
          )}
        >
          <BookingHeader
            heading={heading}
            subheading={subheading}
            enableTitleReveal={enableTitleReveal}
            headerThemeReady={headerThemeReady}
            revealBooking={revealBooking}
            onExpand={handleBookingExpand}
            onCollapse={handleBookingCollapse}
          />
          <BookingBody
            revealBooking={revealBooking}
            options={options}
            optionCtaLabel={optionCtaLabel}
            scheduler={scheduler}
            schedulerOpen={schedulerOpen}
            schedulerLoaded={schedulerLoaded}
            schedulerPanelId={schedulerPanelId}
            schedulerNoteId={schedulerNoteId}
            onSchedulerToggle={handleSchedulerToggle}
          />
        </div>
      </Container>
    </>
  );
};

type BookingBackgroundProps = Readonly<{
  revealBooking: boolean;
  revealPhotoFocus: boolean;
}>;

const BookingBackground = ({ revealBooking, revealPhotoFocus }: BookingBackgroundProps) => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0">
      <Image
        src="/Photos/p-web-89.jpg"
        alt="Perazzi booking options background"
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />
    </div>
    <div
      className={cn(
        "absolute inset-0 bg-(--scrim-strong)",
        revealBooking ? "opacity-0" : "opacity-100",
      )}
      aria-hidden
    />
    <div
      className={cn(
        "absolute inset-0 bg-(--scrim-strong)",
        revealPhotoFocus ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    />
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overlay-gradient-canvas",
        revealPhotoFocus ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    />
  </div>
);

type BookingHeaderProps = Readonly<{
  heading: string;
  subheading: string;
  enableTitleReveal: boolean;
  headerThemeReady: boolean;
  revealBooking: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}>;

const BookingHeader = ({
  heading,
  subheading,
  enableTitleReveal,
  headerThemeReady,
  revealBooking,
  onExpand,
  onCollapse,
}: BookingHeaderProps) => {
  if (revealBooking) {
    return (
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="space-y-3">
          <div className="relative">
            <Heading
              id="experience-booking-heading"
              level={2}
              size="xl"
              className={headerThemeReady ? "text-ink" : "text-white"}
            >
              {heading}
            </Heading>
          </div>
          <div className="relative">
            <Text
              className={cn(
                "type-section-subtitle",
                headerThemeReady ? "text-ink-muted" : "text-white",
              )}
              leading="relaxed"
            >
              {subheading}
            </Text>
          </div>
        </div>
        {enableTitleReveal ? (
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            Collapse
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative inline-flex text-white">
        <Heading
          id="experience-booking-heading"
          level={2}
          size="xl"
          className="type-section-collapsed"
        >
          {heading}
        </Heading>
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer focus-ring"
          onPointerEnter={onExpand}
          onFocus={onExpand}
          onClick={onExpand}
          aria-expanded={revealBooking}
          aria-controls="experience-booking-body"
          aria-labelledby="experience-booking-heading"
        >
          <span className="sr-only">Expand {heading}</span>
        </button>
      </div>
      <div className="relative text-white">
        <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
          {subheading}
        </Text>
      </div>
      <div className="mt-3">
        <Text size="button" className="text-white/80 cursor-pointer focus-ring" asChild>
          <button type="button" onClick={onExpand}>
            Read more
          </button>
        </Text>
      </div>
    </div>
  );
};

type BookingBodyProps = Readonly<{
  revealBooking: boolean;
  options: BookingSection["options"];
  optionCtaLabel: string;
  scheduler: BookingSection["scheduler"];
  schedulerOpen: boolean;
  schedulerLoaded: boolean;
  schedulerPanelId: string;
  schedulerNoteId: string;
  onSchedulerToggle: () => void;
}>;

const BookingBody = ({
  revealBooking,
  options,
  optionCtaLabel,
  scheduler,
  schedulerOpen,
  schedulerLoaded,
  schedulerPanelId,
  schedulerNoteId,
  onSchedulerToggle,
}: BookingBodyProps) => {
  if (!revealBooking) return null;

  return (
    <div id="experience-booking-body" className="space-y-6">
      <BookingOptionsGrid options={options} optionCtaLabel={optionCtaLabel} />
      <SchedulerCard
        scheduler={scheduler}
        schedulerOpen={schedulerOpen}
        schedulerLoaded={schedulerLoaded}
        schedulerPanelId={schedulerPanelId}
        schedulerNoteId={schedulerNoteId}
        onSchedulerToggle={onSchedulerToggle}
      />
    </div>
  );
};

type BookingOptionsGridProps = Readonly<{
  options: BookingSection["options"];
  optionCtaLabel: string;
}>;

const BookingOptionsGrid = ({ options, optionCtaLabel }: BookingOptionsGridProps) => (
  <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3">
    {options.map((option) => (
      <article
        key={option.id}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 hover:border-ink/20 hover:bg-card/80 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-7 lg:p-8"
      >
        <div className="space-y-2">
          <Heading level={3} className="type-card-title text-ink">
            {option.title}
          </Heading>
          <Text size="caption" muted>
            {option.durationLabel ??
              (option.durationMins ? `${option.durationMins} minutes` : "")}
          </Text>
          <SafeHtml
            className="type-body max-w-none leading-relaxed text-ink-muted"
            html={option.descriptionHtml}
          />
        </div>
        <div className="mt-auto pt-6">
          <Button
            asChild
            variant="secondary"
            size="md"
            className="rounded-full px-6 py-3 type-button"
            onClick={() => logAnalytics(`FittingCtaClick:${option.id}`)}
          >
            <a href={option.href}>{optionCtaLabel}</a>
          </Button>
        </div>
      </article>
    ))}
  </div>
);

type SchedulerCardProps = Readonly<{
  scheduler: BookingSection["scheduler"];
  schedulerOpen: boolean;
  schedulerLoaded: boolean;
  schedulerPanelId: string;
  schedulerNoteId: string;
  onSchedulerToggle: () => void;
}>;

const SchedulerCard = ({
  scheduler,
  schedulerOpen,
  schedulerLoaded,
  schedulerPanelId,
  schedulerNoteId,
  onSchedulerToggle,
}: SchedulerCardProps) => {
  if (!scheduler) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-8 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={3} className="type-card-title text-ink">
          {scheduler.title}
        </Heading>
        <Button
          variant="primary"
          size="sm"
          aria-controls={schedulerPanelId}
          aria-expanded={schedulerOpen}
          aria-describedby={schedulerNoteId}
          className="rounded-full px-4 py-2 type-button"
          onClick={onSchedulerToggle}
        >
          {schedulerOpen
            ? scheduler.toggleCloseLabel ?? "Hide scheduler"
            : scheduler.toggleOpenLabel ?? "Begin Your Fitting"}
        </Button>
      </div>
      <p id={schedulerNoteId} className="sr-only">
        {scheduler.helperText ??
          "Selecting Begin Your Fitting loads an embedded booking form below."}
      </p>
      <div
        id={schedulerPanelId}
        className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:bg-card/80 md:p-4 lg:p-5"
        aria-live="polite"
      >
        {schedulerLoaded ? (
          <div className={cn("overflow-hidden", !schedulerOpen && "hidden")} aria-hidden={!schedulerOpen}>
            <iframe
              src={scheduler.src}
              title={scheduler.iframeTitle ?? `Booking — ${scheduler.title}`}
              className="h-[480px] w-full rounded-2xl border border-border/70 bg-card/0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-dashed border-border/70 type-body-sm text-ink-muted">
            The booking form appears here once you choose Begin Your Fitting.
          </div>
        )}
      </div>
      <p className="type-caption text-ink-muted">
        Prefer email?{" "}
        <a
          href={scheduler.fallbackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-perazzi-red focus-ring"
        >
          Open booking in a new tab <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
};
