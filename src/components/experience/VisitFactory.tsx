"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import SafeHtml from "@/components/SafeHtml";
import {
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
  GLASS_REVEAL_MS,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
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
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [expectOpen, setExpectOpen] = useState(false);
  const visitShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({ defaultExpanded: false });

  const mapPanelId = "visit-map-panel";
  const mapNoteId = "visit-map-note";
  const mapHref =
    visit.location.mapLinkHref ??
    `https://maps.google.com/?q=${encodeURIComponent(visit.location.name)}`;

  const revealVisit = phase === "expanded" || phase === "closingHold";
  const revealPhotoFocus = revealVisit;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealVisit && motionEnabled;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter]";
  const titleColorTransition = "transition-colors";
  const cinematicBezier = `cubic-bezier(${EASE_CINEMATIC.join(",")})`;
  const transitionStyle = (durationMs: number) => ({
    transitionDuration: `${motionEnabled ? Math.round(durationMs * EXPAND_TIME_SCALE) : 0}ms`,
    transitionTimingFunction: motionEnabled ? cinematicBezier : "linear",
  });
  const focusSurfaceStyle = transitionStyle(GLASS_REVEAL_MS);
  const titleColorStyle = transitionStyle(EXPANDED_HEADER_REVEAL_MS);
  const visitLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
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
    blurPx: 8,
    glassScale: 0.985,
  });
  const surfaceVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    scrimMode: "dualFocusFade",
    itemOffsetY: 12,
    blurPx: 0,
    glassScale: 0.985,
  });
  const slotContext = {
    collapsed: {},
    prezoom: {},
    expanded: {},
    closingHold: {},
  } as const;
  const headerItem = slotVariants.expandedHeader;
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const surfaceItem = surfaceVariants.content;
  const glassStyle = {
    ...(enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : {}),
    ...focusSurfaceStyle,
  };

  const handleVisitExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    open();
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
    close();
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
    <motion.div
      variants={slotContext}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
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
          ref={visitShellRef}
          style={glassStyle}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            visitMinHeight,
          )}
          variants={slotVariants.glass}
          onKeyDown={onEscapeKeyDown}
        >
          <LayoutGroup id="visit-factory-title">
            {showExpanded ? (
              <motion.div
                key="visit-factory-header"
                className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-3" variants={headerGroup}>
                  <motion.div
                    layoutId="visit-factory-title"
                    layoutCrossfade={false}
                    transition={visitLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headerItem}>
                      <Heading
                        id="visit-factory-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                        style={titleColorStyle}
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    layoutId="visit-factory-subtitle"
                    layoutCrossfade={false}
                    transition={visitLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headerItem}>
                      <Text
                        size="lg"
                        className={cn(
                          "type-section-subtitle",
                          titleColorTransition,
                          headerThemeReady ? "text-ink-muted" : "text-white",
                        )}
                        style={titleColorStyle}
                      >
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                  {visit.introHtml ? (
                    <motion.div variants={headerItem}>
                      <SafeHtml
                        className="prose-journal max-w-none text-ink-muted md:max-w-4xl lg:max-w-4xl"
                        html={visit.introHtml}
                      />
                    </motion.div>
                  ) : null}
                </motion.div>
                <motion.div variants={surfaceItem}>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                    onClick={handleVisitCollapse}
                  >
                    Collapse
                  </button>
                </motion.div>
              </motion.div>
            ) : null}
            {showCollapsed ? (
              <motion.div
                key="visit-factory-collapsed"
                className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="flex flex-col items-center gap-3" variants={headerGroup}>
                  <motion.div
                    layoutId="visit-factory-title"
                    layoutCrossfade={false}
                    transition={visitLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Heading
                        id="visit-factory-heading"
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
                      onFocus={handleVisitExpand}
                      onClick={handleVisitExpand}
                      onKeyDown={onTriggerKeyDown}
                      aria-expanded={expanded}
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
                      <button type="button" onClick={handleVisitExpand} onKeyDown={onTriggerKeyDown}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </LayoutGroup>

          <motion.div
            variants={slotContext}
            initial={motionEnabled ? "collapsed" : false}
            animate={phase}
          >
            {showExpanded ? (
              <motion.div
                key="visit-factory-body"
                id="visit-factory-body"
                className="space-y-6"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div
                  className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start"
                  variants={bodyGroup}
                >
                  <motion.article
                    className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated lg:p-7"
                    variants={bodyItem}
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

                  <motion.div className="space-y-4" variants={bodyItem}>
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
          </motion.div>
        </motion.div>
      </Container>
    </motion.div>
  );
};
