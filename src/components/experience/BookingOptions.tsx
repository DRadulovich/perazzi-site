"use client";

import { useEffect, useState } from "react";
import SafeHtml from "@/components/SafeHtml";
import {
  Button,
  Container,
  Heading,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";
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
  onCollapsedChange?: (collapsed: boolean) => void;
}>;

export function BookingOptions({ bookingSection }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("ExperienceBookingSeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const bookingKey = enableTitleReveal ? "title-reveal" : "always-reveal";
  const options = bookingSection.options;

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  if (!options.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperienceBookingSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="experience-booking-heading"
    >
      <BookingOptionsRevealSection
        key={bookingKey}
        bookingSection={bookingSection}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

const BookingOptionsRevealSection = ({
  bookingSection,
  enableTitleReveal,
  onCollapsedChange,
}: BookingOptionsRevealSectionProps) => {
  const [bookingExpanded, setBookingExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerLoaded, setSchedulerLoaded] = useState(false);

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
  const {
    ref: bookingShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealBooking,
    deps: [schedulerOpen, schedulerLoaded, options.length],
  });
  const revealBookingForMeasure = revealBooking || isPreparing;

  const handleBookingExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setBookingExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleBookingCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setBookingExpanded(false);
    onCollapsedChange?.(true);
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

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <RevealExpandedHeader
          headingId="experience-booking-heading"
          heading={heading}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={handleBookingCollapse}
        >
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
        </RevealExpandedHeader>
      </RevealItem>
      <RevealGroup delayMs={140}>
        <BookingBody
          revealBooking={revealBookingForMeasure}
          options={options}
          optionCtaLabel={optionCtaLabel}
          scheduler={scheduler}
          schedulerOpen={schedulerOpen}
          schedulerLoaded={schedulerLoaded}
          schedulerPanelId={schedulerPanelId}
          schedulerNoteId={schedulerNoteId}
          onSchedulerToggle={handleSchedulerToggle}
        />
      </RevealGroup>
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: "/Photos/p-web-89.jpg", alt: "Perazzi booking options background" }}
        reveal={revealBooking}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealBooking}
        overlay="canvas"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={bookingShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={bookingMinHeight ?? undefined}
        >
          {revealBooking ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="experience-booking-heading"
                heading={heading}
                subheading={subheading}
                controlsId="experience-booking-body"
                expanded={revealBooking}
                onExpand={handleBookingExpand}
              />
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </Container>
    </>
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
      <RevealItem index={options.length}>
        <SchedulerCard
          scheduler={scheduler}
          schedulerOpen={schedulerOpen}
          schedulerLoaded={schedulerLoaded}
          schedulerPanelId={schedulerPanelId}
          schedulerNoteId={schedulerNoteId}
          onSchedulerToggle={onSchedulerToggle}
        />
      </RevealItem>
    </div>
  );
};

type BookingOptionsGridProps = Readonly<{
  options: BookingSection["options"];
  optionCtaLabel: string;
}>;

const BookingOptionsGrid = ({ options, optionCtaLabel }: BookingOptionsGridProps) => (
  <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3">
    {options.map((option, index) => (
      <RevealItem key={option.id} index={index}>
        <article
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
      </RevealItem>
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
