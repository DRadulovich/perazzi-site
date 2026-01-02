"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import { Button, Container, Heading, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useHeightLock } from "@/hooks/use-height-lock";
import { logAnalytics } from "@/lib/analytics";
import { getSectionHeadingVariants, homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";
import type { BookingSection } from "@/types/experience";

type BookingOptionsProps = Readonly<{
  bookingSection: BookingSection;
}>;

type BookingOptionsRevealSectionProps = Readonly<{
  bookingSection: BookingSection;
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
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
      />
    </section>
  );
}

const BookingOptionsRevealSection = ({
  bookingSection,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: BookingOptionsRevealSectionProps) => {
  const [bookingExpanded, setBookingExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerLoaded, setSchedulerLoaded] = useState(false);

  const bookingShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

  const schedulerPanelId = "experience-scheduler-panel";
  const schedulerNoteId = "experience-scheduler-note";
  const options = bookingSection.options;
  const scheduler = bookingSection.scheduler;
  const heading = bookingSection.heading ?? "Book a fitting";
  const subheading = bookingSection.subheading ?? "Choose the session that fits your journey";
  const optionCtaLabel = bookingSection.optionCtaLabel ?? "Reserve this session";

  const revealBooking = !enableTitleReveal || bookingExpanded;
  const revealPhotoFocus = revealBooking;
  const parallaxStrength = "16%";
  const sectionInView = useInView(sectionRef, { amount: 0.35 });
  const parallaxEnabled = motionEnabled && revealBooking && sectionInView;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition =
    "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition =
    "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const bookingReveal = homeMotion.revealSlow;
  const bookingRevealFast = homeMotion.reveal;
  const bookingCollapse = homeMotion.collapse;
  const bookingBodyReveal = motionEnabled
    ? { ...bookingReveal, delay: homeMotion.sectionHeader.bodyDelay }
    : bookingReveal;
  const readMoreReveal = motionEnabled
    ? { ...homeMotion.revealFast, delay: homeMotion.sectionHeader.readMoreDelayAfterHeader }
    : undefined;
  const bookingLayoutTransition = motionEnabled ? { layout: bookingReveal } : undefined;
  const bookingMinHeight = enableTitleReveal ? "min-h-[calc(720px+16rem)]" : null;
  const expandedHeight = useHeightLock(bookingShellRef, {
    enabled: enableTitleReveal && revealBooking,
    duration: bookingReveal.duration,
  });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", parallaxEnabled ? parallaxStrength : "0%"],
  );
  const parallaxStyle = parallaxEnabled ? { y: parallaxY } : undefined;
  const backgroundScale = parallaxEnabled ? 1.32 : 1;
  const backgroundScaleTransition = revealBooking ? bookingReveal : bookingCollapse;

  const { headingContainer, headingItem } = getSectionHeadingVariants({
    motionEnabled,
    transition: bookingReveal,
  });

  const handleBookingExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setBookingExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handleBookingCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setBookingExpanded(false);
  };

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={parallaxStyle}
          initial={false}
          animate={motionEnabled ? { scale: backgroundScale } : undefined}
          transition={motionEnabled ? backgroundScaleTransition : undefined}
        >
          <Image
            src="/Photos/p-web-89.jpg"
            alt="Perazzi booking options background"
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </motion.div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealBooking ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 film-grain",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-20" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 overlay-gradient-canvas",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <motion.div
          ref={bookingShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            bookingMinHeight,
          )}
        >
          <LayoutGroup id="experience-booking-title">
            <AnimatePresence initial={false}>
              {revealBooking ? (
                <motion.div
                  key="experience-booking-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: bookingReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: bookingRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
                    <motion.div
                      layoutId="experience-booking-title"
                      layoutCrossfade={false}
                      transition={bookingLayoutTransition}
                      className="relative"
                      variants={headingItem}
                    >
                      <Heading
                        id="experience-booking-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <motion.div
                      layoutId="experience-booking-subtitle"
                      layoutCrossfade={false}
                      transition={bookingLayoutTransition}
                      className="relative"
                      variants={headingItem}
                    >
                      <Text
                        className={cn(
                          "type-section-subtitle",
                          titleColorTransition,
                          headerThemeReady ? "text-ink-muted" : "text-white",
                        )}
                        leading="relaxed"
                      >
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                  {enableTitleReveal ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleBookingCollapse}
                    >
                      Collapse
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="experience-booking-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1 } : undefined}
                  exit={motionEnabled ? { opacity: 0 } : undefined}
                  transition={motionEnabled ? bookingRevealFast : undefined}
                >
                  <motion.div
                    layoutId="experience-booking-title"
                    layoutCrossfade={false}
                    transition={bookingLayoutTransition}
                    className="relative inline-flex text-white"
                  >
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
                      onPointerEnter={handleBookingExpand}
                      onFocus={handleBookingExpand}
                      onClick={handleBookingExpand}
                      aria-expanded={revealBooking}
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
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {subheading}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: bookingRevealFast } : undefined}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleBookingExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealBooking ? (
              <motion.div
                key="experience-booking-body"
                id="experience-booking-body"
                className="space-y-6"
                initial={motionEnabled ? { opacity: 0, y: 24 } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, transition: bookingBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, transition: bookingCollapse }
                    : undefined
                }
              >
                <motion.div
                  className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3"
                  initial={motionEnabled ? "hidden" : false}
                  animate={motionEnabled ? "show" : undefined}
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: motionEnabled ? homeMotion.staggerShort : 0 } },
                  }}
                >
                  {options.map((option) => (
                    <motion.article
                      key={option.id}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated md:p-7 lg:p-8"
                      variants={{
                        hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
                        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
                      }}
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
                    initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                    transition={motionEnabled ? homeMotion.revealFast : undefined}
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
                          initial={motionEnabled ? { height: 0, opacity: 0, filter: "blur(10px)" } : false}
                          animate={schedulerOpen ? { height: "auto", opacity: 1, filter: "blur(0px)" } : { height: 0, opacity: 0, filter: "blur(10px)" }}
                          transition={motionEnabled ? homeMotion.revealFast : undefined}
                          aria-hidden={!schedulerOpen}
                        >
                          <iframe
                            src={scheduler.src}
                            title={scheduler.iframeTitle ?? `Booking — ${scheduler.title}`}
                            className="h-[480px] w-full rounded-2xl border border-border/70 bg-card/0"
                            loading="lazy"
                          />
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
            ) : null}
          </AnimatePresence>
        </motion.div>
      </Container>
    </>
  );
};
