"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import SafeHtml from "@/components/SafeHtml";
import { homeMotion } from "@/lib/motionConfig";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Container, Heading, Text } from "@/components/ui";

type VisitFactoryProps = {
  readonly visitFactorySection: VisitFactoryData;
};

type VisitFactoryRevealSectionProps = {
  readonly visit: VisitFactoryData;
  readonly heading: string;
  readonly subheading: string;
  readonly background: { url: string; alt?: string };
  readonly enableTitleReveal: boolean;
  readonly motionEnabled: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
};

export function VisitFactory({ visitFactorySection }: VisitFactoryProps) {
  const analyticsRef = useAnalyticsObserver("VisitFactorySeen");
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
  const visitKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const visit = visitFactorySection;
  const background = {
    url: visit.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-visitfactory-bg.jpg",
    alt: visit.backgroundImage?.alt ?? "Perazzi Botticino factory background",
  };
  const heading = visit.heading ?? "Visit Botticino";
  const subheading = visit.subheading ?? "See the factory in person";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="VisitFactorySeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="visit-factory-heading"
    >
      <VisitFactoryRevealSection
        key={visitKey}
        visit={visit}
        heading={heading}
        subheading={subheading}
        background={background}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
      />
    </section>
  );
}

const VisitFactoryRevealSection = ({
  visit,
  heading,
  subheading,
  background,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: VisitFactoryRevealSectionProps) => {
  const [visitExpanded, setVisitExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [expectOpen, setExpectOpen] = useState(false);
  const visitShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

  const mapPanelId = "visit-map-panel";
  const mapNoteId = "visit-map-note";
  const mapHref =
    visit.location.mapLinkHref ??
    `https://maps.google.com/?q=${encodeURIComponent(visit.location.name)}`;

  const revealVisit = !enableTitleReveal || visitExpanded;
  const revealPhotoFocus = revealVisit;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealVisit;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition =
    "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition =
    "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const visitReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const visitRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const visitCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const visitBodyReveal = visitReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: visitReveal.duration }
    : undefined;
  const visitLayoutTransition = motionEnabled ? { layout: visitReveal } : undefined;
  const visitMinHeight = enableTitleReveal ? "min-h-[calc(640px+16rem)]" : null;
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
  const backgroundScaleTransition = revealVisit ? visitReveal : visitCollapse;

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: visitReveal },
  } as const;

  const detailsContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.1 : 0 } },
  } as const;

  const detailsItem = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: visitReveal },
  } as const;

  const handleVisitExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setVisitExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handleVisitCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setVisitExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealVisit) return;
    const node = visitShellRef.current;
    if (!node) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => { cancelAnimationFrame(frame); };
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enableTitleReveal, revealVisit, expectOpen]);

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
            src={background.url}
            alt={background.alt ?? "Perazzi Botticino factory background"}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
            loading="lazy"
          />
        </motion.div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealVisit ? "opacity-0" : "opacity-100",
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
          ref={visitShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            visitMinHeight,
          )}
        >
          <LayoutGroup id="visit-factory-title">
            <AnimatePresence initial={false}>
              {revealVisit ? (
                <motion.div
                  key="visit-factory-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: visitReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: visitRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
                    <motion.div
                      layoutId="visit-factory-title"
                      layoutCrossfade={false}
                      transition={visitLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="visit-factory-heading"
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
                      layoutId="visit-factory-subtitle"
                      layoutCrossfade={false}
                      transition={visitLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Text
                          size="lg"
                          className={cn(
                            "type-section-subtitle",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                        >
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                    {visit.introHtml ? (
                      <motion.div variants={headingItem}>
                        <SafeHtml
                          className="prose-journal max-w-none text-ink-muted md:max-w-4xl lg:max-w-4xl"
                          html={visit.introHtml}
                        />
                      </motion.div>
                    ) : null}
                  </motion.div>
                  {enableTitleReveal ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleVisitCollapse}
                    >
                      Collapse
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="visit-factory-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                  exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                  transition={motionEnabled ? visitRevealFast : undefined}
                >
                  <motion.div
                    layoutId="visit-factory-title"
                    layoutCrossfade={false}
                    transition={visitLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <Heading
                      id="visit-factory-heading"
                      level={2}
                      size="xl"
                      className="type-section-collapsed"
                    >
                      {heading}
                    </Heading>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onPointerEnter={handleVisitExpand}
                      onFocus={handleVisitExpand}
                      onClick={handleVisitExpand}
                      aria-expanded={revealVisit}
                      aria-controls="visit-factory-body"
                      aria-labelledby="visit-factory-heading"
                    >
                      <span className="sr-only">Expand {heading}</span>
                    </button>
                  </motion.div>
                  <motion.div
                    layoutId="visit-factory-subtitle"
                    layoutCrossfade={false}
                    transition={visitLayoutTransition}
                    className="relative text-white"
                  >
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {subheading}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: visitRevealFast } : undefined}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleVisitExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealVisit ? (
              <motion.div
                key="visit-factory-body"
                id="visit-factory-body"
                className="space-y-6"
                initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, filter: "blur(0px)", transition: visitBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, filter: "blur(10px)", transition: visitCollapse }
                    : undefined
                }
              >
                <motion.div
                  className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start"
                  variants={detailsContainer}
                  initial={motionEnabled ? "hidden" : false}
                  animate={motionEnabled ? "show" : undefined}
                >
                  <motion.article
                    className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated lg:p-7"
                    variants={detailsItem}
                  >
                    <Text size="label-tight" muted>
                      Botticino headquarters
                    </Text>
                    <Heading level={3} size="sm" className="type-card-title text-ink">
                      {visit.location.name}
                    </Heading>
                    <SafeHtml
                      className="type-card-body text-ink-muted"
                      html={visit.location.addressHtml}
                    />
                    {visit.location.hoursHtml ? (
                      <SafeHtml
                        className="type-label-tight text-ink-muted"
                        html={visit.location.hoursHtml}
                      />
                    ) : null}
                    {visit.location.notesHtml ? (
                      <SafeHtml
                        className="type-card-body text-ink-muted"
                        html={visit.location.notesHtml}
                      />
                    ) : null}
                    <div className="space-y-3 pt-2">
                      <p id={mapNoteId} className="sr-only">
                        Selecting Open map loads an interactive map you can pan and zoom.
                      </p>
                      <div
                        id={mapPanelId}
                        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-(--color-canvas) shadow-soft ring-1 ring-border/70 aspect-dynamic"
                        style={{ "--aspect-ratio": visit.location.staticMap.aspectRatio ?? 3 / 2 }}
                        aria-live="polite"
                      >
                        {visit.location.mapEmbedSrc ? (
                          <iframe
                            src={visit.location.mapEmbedSrc}
                            title={`Map to ${visit.location.name}`}
                            className="h-full w-full"
                            loading="lazy"
                            aria-describedby={mapNoteId}
                          />
                        ) : (
                          <Image
                            src={visit.location.staticMap.url}
                            alt={visit.location.staticMap.alt}
                            fill
                            sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
                        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                        <div
                          className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/70 via-(--scrim-strong)/40 to-transparent"
                          aria-hidden
                        />
                      </div>
                      <a
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 type-button text-perazzi-red transition hover:translate-x-0.5 focus-ring"
                      >
                        Open in Maps{" "}
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </div>
                  </motion.article>

                  <motion.div className="space-y-4" variants={detailsItem}>
                    {visit.whatToExpectHtml ? (
                      <Collapsible open={expectOpen} onOpenChange={setExpectOpen}>
                        <CollapsibleTrigger
                          className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left type-card-title text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 hover:translate-x-0.5 focus-ring sm:rounded-3xl sm:bg-card/80"
                          aria-expanded={expectOpen}
                          aria-controls="visit-expect-content"
                        >
                          What to expect{" "}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "text-lg transition-transform",
                              expectOpen ? "rotate-45" : "rotate-0",
                            )}
                          >
                            +
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent
                          id="visit-expect-content"
                          className="mt-3 rounded-2xl border border-border/70 bg-card/60 p-4 type-card-body text-ink-muted shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80"
                        >
                          <SafeHtml
                            className="max-w-none type-card-body text-ink-muted"
                            html={visit.whatToExpectHtml}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    ) : null}
                    <Button
                      asChild
                      size="lg"
                      onClick={() => logAnalytics("VisitCtaClick")}
                      className="rounded-full px-6 py-3 type-button"
                    >
                      <a href={visit.cta.href}>{visit.cta.label}</a>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </Container>
    </>
  );
};
