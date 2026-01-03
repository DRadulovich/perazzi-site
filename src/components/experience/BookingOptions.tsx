"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { LayoutGroup, motion, useReducedMotion, useScroll } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import { Button, Container, Heading, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import {
  CONTENT_REVEAL_MS,
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPAND_TIME_SCALE,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import {
  buildGlassToneVariants,
  buildTitleToneVariants,
  mergeVariants,
} from "@/motion/expandableSectionTone";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
import { useParallaxMotion } from "@/motion/useParallaxMotion";
import { ExpandableTextReveal } from "@/components/motion/ExpandableTextReveal";
import type { BookingSection } from "@/types/experience";

type BookingOptionsProps = Readonly<{
  bookingSection: BookingSection;
}>;

type BookingOptionsRevealSectionProps = Readonly<{
  bookingSection: BookingSection;
  isDesktop: boolean;
  enableTitleReveal: boolean;
  motionEnabled: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}>;

export function BookingOptions({ bookingSection }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("ExperienceBookingSeen");
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
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
        isDesktop={isDesktop}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
      />
    </section>
  );
}

const BookingOptionsRevealSection = ({
  bookingSection,
  isDesktop,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: BookingOptionsRevealSectionProps) => {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerLoaded, setSchedulerLoaded] = useState(false);
  const [schedulerHeight, setSchedulerHeight] = useState<number | null>(null);

  const schedulerContentRef = useRef<HTMLDivElement | null>(null);
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({
    defaultExpanded: false,
    containerRef: sectionRef,
    scrollOnExpand: true,
  });

  const schedulerPanelId = "experience-scheduler-panel";
  const schedulerNoteId = "experience-scheduler-note";
  const options = bookingSection.options;
  const scheduler = bookingSection.scheduler;
  const heading = bookingSection.heading ?? "Book a fitting";
  const subheading = bookingSection.subheading ?? "Choose the session that fits your journey";
  const optionCtaLabel = bookingSection.optionCtaLabel ?? "Reserve this session";

  const revealBooking = phase === "expanded" || phase === "closingHold";
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const parallaxStrength = 0.16;
  const parallaxEnabled = enableTitleReveal && !revealBooking && motionEnabled;
  const bookingLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useParallaxMotion(scrollYProgress, {
    enabled: parallaxEnabled,
    strength: parallaxStrength,
    targetRef: sectionRef,
  });
  const parallaxStyle = motionEnabled ? { y: parallaxY } : undefined;
  const toSeconds = (ms: number) => ms / 1000;
  const staggerTransition = (staggerMs: number, direction?: 1 | -1) => ({
    transition: {
      staggerChildren: motionEnabled ? toSeconds(staggerMs) : 0,
      staggerDirection: direction,
    },
  });
  const headerGroup = {
    collapsed: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    expanded: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
  } as const;
  const bodyGroup = {
    collapsed: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_BODY_ITEMS_MS),
    expanded: staggerTransition(STAGGER_BODY_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
  } as const;
  const itemsGroup = {
    collapsed: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_LIST_ITEMS_MS),
    expanded: staggerTransition(STAGGER_LIST_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
  } as const;
  const slotVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    scrimMode: "dualFocusFade",
    backgroundScale: { collapsed: 1.32, prezoom: 1.12, expanded: 1 },
    itemOffsetY: 12,
    blurPx: 6,
    glassScale: 0.985,
  });
  const surfaceVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    scrimMode: "dualFocusFade",
    itemOffsetY: 12,
    blurPx: 0,
    glassScale: 0.985,
  });
  const headingToneVariants = buildTitleToneVariants("--color-ink");
  const subheadingToneVariants = buildTitleToneVariants("--color-ink-muted");
  const headingItem = mergeVariants(slotVariants.expandedHeader, headingToneVariants);
  const subheadingItem = mergeVariants(slotVariants.expandedHeader, subheadingToneVariants);
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const surfaceItem = surfaceVariants.content;
  const glassSurfaceStrength = isDesktop ? 25 : 40;
  const glassToneVariants = buildGlassToneVariants({
    backgroundStrength: glassSurfaceStrength,
    borderStrength: 70,
    blurPx: 12,
    shadow: isDesktop ? "elevated" : "soft",
  });
  const glassVariants = mergeVariants(slotVariants.glass, glassToneVariants);
  const containerLayoutTransition = {
    layout: {
      duration: motionEnabled
        ? (CONTAINER_EXPAND_MS / 1000) * (isCollapsedPhase ? COLLAPSE_TIME_SCALE : EXPAND_TIME_SCALE)
        : 0,
      ease: EASE_CINEMATIC,
    },
  };
  const glassStyle = {
    minHeight: "40vh",
    overflow: isCollapsedPhase ? "hidden" : "visible",
  };
  const schedulerTransition = motionEnabled
    ? { duration: toSeconds(CONTENT_REVEAL_MS), ease: EASE_CINEMATIC }
    : undefined;

  const handleBookingExpand = () => {
    if (!enableTitleReveal) return;
    open();
  };

  const handleBookingCollapse = () => {
    if (!enableTitleReveal) return;
    close();
  };

  useEffect(() => {
    if (!schedulerLoaded || !schedulerOpen) return;
    const node = schedulerContentRef.current;
    if (!node) return;

    const frame = requestAnimationFrame(() => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setSchedulerHeight((prev) => prev ?? nextHeight);
    });

    return () => cancelAnimationFrame(frame);
  }, [schedulerLoaded, schedulerOpen]);

  return (
    <motion.div
      variants={slotVariants.section}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
            <Image
              src="/Photos/p-web-89.jpg"
              alt="Perazzi booking options background"
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimTop}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0 pointer-events-none" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        </motion.div>
        <motion.div className="absolute inset-0 pointer-events-none" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas" aria-hidden />
        </motion.div>
      </motion.div>

      <Container size="xl" className="relative z-10">
        <motion.div
          style={glassStyle}
          className="relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
          variants={glassVariants}
          onKeyDown={onEscapeKeyDown}
          layout
          transition={containerLayoutTransition}
        >
          <LayoutGroup id="experience-booking-title">
            {showExpanded ? (
              <motion.div
                key="experience-booking-header"
                className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                variants={slotVariants.section}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-3" variants={headerGroup}>
                  <motion.div
                    layoutId="experience-booking-title"
                    layoutCrossfade={false}
                    transition={bookingLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headingItem}>
                      <Heading
                        id="experience-booking-heading"
                        level={2}
                        size="xl"
                      >
                        <ExpandableTextReveal text={heading} reduceMotion={!motionEnabled} />
                      </Heading>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    layoutId="experience-booking-subtitle"
                    layoutCrossfade={false}
                    transition={bookingLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={subheadingItem}>
                      <Text className="type-section-subtitle" leading="relaxed">
                        <ExpandableTextReveal text={subheading} reduceMotion={!motionEnabled} />
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div variants={surfaceItem}>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                    onClick={handleBookingCollapse}
                  >
                    Collapse
                  </button>
                </motion.div>
              </motion.div>
            ) : null}
            {showCollapsed ? (
              <motion.div
                key="experience-booking-collapsed"
                className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                variants={slotVariants.section}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="flex flex-col items-center gap-3" variants={headerGroup}>
                  <motion.div
                    layoutId="experience-booking-title"
                    layoutCrossfade={false}
                    transition={bookingLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Heading
                        id="experience-booking-heading"
                        level={2}
                        size="xl"
                        className="type-section-collapsed"
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onFocus={handleBookingExpand}
                      onClick={handleBookingExpand}
                      onKeyDown={onTriggerKeyDown}
                      aria-expanded={expanded}
                      aria-controls="experience-booking-body"
                      aria-labelledby="experience-booking-heading"
                    >
                      <span className="sr-only">Expand {heading}</span>
                    </button>
                  </motion.div>
                  <motion.div
                    layoutId="experience-booking-subtitle"
                    layoutCrossfade={false}
                    transition={bookingLayoutTransition}
                    className="relative text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div variants={itemsGroup} className="mt-3">
                  <motion.div variants={collapsedHeaderItem}>
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleBookingExpand} onKeyDown={onTriggerKeyDown}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </LayoutGroup>

          <motion.div
            variants={slotVariants.section}
            initial={motionEnabled ? "collapsed" : false}
            animate={phase}
          >
            {showExpanded ? (
              <motion.div
                key="experience-booking-body"
                id="experience-booking-body"
                className="space-y-6"
                variants={slotVariants.section}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-6" variants={bodyGroup}>
                  <motion.div
                    className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3"
                    variants={itemsGroup}
                  >
                    {options.map((option) => (
                      <motion.article
                        key={option.id}
                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-7 lg:p-8 motion-reduce:transition-none motion-reduce:transform-none"
                        variants={bodyItem}
                      >
                        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                        <div className="space-y-2">
                          <Heading level={3} className="type-card-title text-ink">
                            {option.title}
                          </Heading>
                          <Text size="caption" muted>
                            {option.durationLabel ?? (option.durationMins ? `${option.durationMins} minutes` : "")}
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
                            onClick={() =>
                              logAnalytics(`FittingCtaClick:${option.id}`)
                            }
                          >
                            <a href={option.href}>{optionCtaLabel}</a>
                          </Button>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>

                  {scheduler ? (
                    <motion.div
                      className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-8 lg:p-10"
                      variants={bodyItem}
                    >
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
                          onClick={() => {
                            setSchedulerOpen((prev) => {
                              const next = !prev;
                              if (next && !schedulerLoaded) {
                                setSchedulerLoaded(true);
                              }
                              logAnalytics(
                                `ExperienceScheduler:${next ? "open" : "close"}`,
                              );
                              return next;
                            });
                          }}
                        >
                          {schedulerOpen
                            ? scheduler.toggleCloseLabel ?? "Hide scheduler"
                            : scheduler.toggleOpenLabel ?? "Begin Your Fitting"}
                        </Button>
                      </div>
                      <p id={schedulerNoteId} className="sr-only">
                        {scheduler.helperText ?? "Selecting Begin Your Fitting loads an embedded booking form below."}
                      </p>
                      <div
                        id={schedulerPanelId}
                        className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:bg-card/80 md:p-4 lg:p-5"
                        aria-live="polite"
                      >
                        {schedulerLoaded ? (
                          <motion.div
                            className="overflow-hidden"
                            initial={motionEnabled ? { height: 0, opacity: 0, filter: "blur(6px)" } : false}
                            animate={schedulerOpen
                              ? (motionEnabled
                                ? { height: schedulerHeight ?? 480, opacity: 1, filter: "blur(0px)" }
                                : { height: schedulerHeight ?? 480, opacity: 1 })
                              : (motionEnabled
                                ? { height: 0, opacity: 0, filter: "blur(6px)" }
                                : { height: 0, opacity: 0 })
                            }
                            transition={schedulerTransition}
                            aria-hidden={!schedulerOpen}
                          >
                            <div ref={schedulerContentRef}>
                              <iframe
                                src={scheduler.src}
                                title={scheduler.iframeTitle ?? `Booking — ${scheduler.title}`}
                                className="h-[480px] w-full rounded-2xl border border-border/70 bg-card/0"
                                loading="lazy"
                              />
                            </div>
                          </motion.div>
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
                          Open booking in a new tab{" "}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </p>
                    </motion.div>
                  ) : null}
                </motion.div>
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      </Container>
    </motion.div>
  );
};
