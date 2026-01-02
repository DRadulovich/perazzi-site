"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";

import type {
  AuthorizedDealerEntry,
  ExperienceNetworkData,
  ScheduledEventEntry,
  TravelNetworkUi,
} from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Container, Heading, Text } from "@/components/ui";
import { homeMotion } from "@/lib/motionConfig";
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

type TabKey = "schedule" | "dealers";

type TravelNetworkProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
}>;

type TravelNetworkRevealSectionProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
  enableTitleReveal: boolean;
  motionEnabled: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}>;

type ListRevealConfig = Readonly<{
  phase: "collapsed" | "prezoom" | "expanded" | "closingHold";
  motionEnabled: boolean;
  listGroup: Variants;
  listItem: Variants;
}>;

type ScheduleListProps = Readonly<{
  events: readonly ScheduledEventEntry[];
  emptyText: string;
  listReveal: ListRevealConfig;
}>;

type DealerListProps = Readonly<{
  dealers: readonly AuthorizedDealerEntry[];
  emptyText: string;
  listReveal: ListRevealConfig;
}>;

export function TravelNetwork({ data, ui }: TravelNetworkProps) {
  const analyticsRef = useAnalyticsObserver("TravelNetworkSeen");
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
  const travelKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="travel-network-heading"
    >
      <TravelNetworkRevealSection
        key={travelKey}
        data={data}
        ui={ui}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={analyticsRef}
      />
    </section>
  );
}

const TravelNetworkRevealSection = ({
  data,
  ui,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: TravelNetworkRevealSectionProps) => {
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const networkShellRef = useRef<HTMLDivElement | null>(null);
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
  } = useExpandableSectionTimeline({ defaultExpanded: !enableTitleReveal });

  const tabs = useMemo(
    () => [
      {
        key: "schedule" as const,
        label: ui.scheduleTabLabel ?? "Our Travel Schedule",
        count: data.scheduledEvents.length,
      },
      {
        key: "dealers" as const,
        label: ui.dealersTabLabel ?? "Our Dealers",
        count: data.dealers.length,
      },
    ],
    [data.dealers.length, data.scheduledEvents.length, ui.dealersTabLabel, ui.scheduleTabLabel],
  );
  const heading = ui.title ?? "Travel network";
  const lead = ui.lead ?? "Meet us on the road";
  const supporting =
    ui.supporting ?? "Track our travel schedule or connect with a trusted Perazzi dealer closest to you.";
  const background = {
    url: ui.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg",
    alt: ui.backgroundImage?.alt ?? "Perazzi travel network background",
  };
  const emptyScheduleText =
    ui.emptyScheduleText ?? "New travel stops are being confirmed. Check back shortly.";
  const emptyDealersText = ui.emptyDealersText ?? "Dealer roster is being configured in Sanity.";

  const revealNetwork = phase === "expanded" || phase === "closingHold";
  const revealPhotoFocus = revealNetwork;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealNetwork && motionEnabled;
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
  const networkLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
  const networkMinHeight = enableTitleReveal ? "min-h-[calc(720px+16rem)]" : null;
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
  const listReveal: ListRevealConfig = {
    phase,
    motionEnabled,
    listGroup: itemsGroup,
    listItem: surfaceVariants.content,
  };

  const handleNetworkExpand = () => {
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

  const handleNetworkCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    close();
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealNetwork) return;
    const node = networkShellRef.current;
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
  }, [enableTitleReveal, revealNetwork, activeTab, data.dealers.length, data.scheduledEvents.length]);

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
              alt={background.alt ?? "Perazzi travel network background"}
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
          ref={networkShellRef}
          style={glassStyle}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            networkMinHeight,
          )}
          variants={slotVariants.glass}
          onKeyDown={onEscapeKeyDown}
        >
          <LayoutGroup id="experience-travel-network-title">
            {showExpanded ? (
              <motion.div
                key="travel-network-header"
                className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-3" variants={headerGroup}>
                  <motion.div
                    layoutId="travel-network-title"
                    layoutCrossfade={false}
                    transition={networkLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headerItem}>
                      <Heading
                        id="travel-network-heading"
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
                    layoutId="travel-network-subtitle"
                    layoutCrossfade={false}
                    transition={networkLayoutTransition}
                    className="relative"
                  >
                    <motion.div variants={headerItem}>
                      <Text
                        className={cn(
                          "type-section-subtitle",
                          titleColorTransition,
                          headerThemeReady ? "text-ink-muted" : "text-white",
                        )}
                        style={titleColorStyle}
                        leading="relaxed"
                      >
                        {lead}
                      </Text>
                    </motion.div>
                  </motion.div>
                  <motion.div variants={headerItem}>
                    <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                      {supporting}
                    </Text>
                  </motion.div>
                </motion.div>
                {enableTitleReveal ? (
                  <motion.div variants={surfaceItem}>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleNetworkCollapse}
                    >
                      Collapse
                    </button>
                  </motion.div>
                ) : null}
              </motion.div>
            ) : null}
            {showCollapsed ? (
              <motion.div
                key="travel-network-collapsed"
                className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="flex flex-col items-center gap-3" variants={headerGroup}>
                  <motion.div
                    layoutId="travel-network-title"
                    layoutCrossfade={false}
                    transition={networkLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Heading
                        id="travel-network-heading"
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
                      onPointerEnter={handleNetworkExpand}
                      onFocus={handleNetworkExpand}
                      onClick={handleNetworkExpand}
                      onKeyDown={onTriggerKeyDown}
                      aria-expanded={expanded}
                      aria-controls="travel-network-body"
                      aria-labelledby="travel-network-heading"
                    >
                      <span className="sr-only">Expand {heading}</span>
                    </button>
                  </motion.div>
                  <motion.div
                    layoutId="travel-network-subtitle"
                    layoutCrossfade={false}
                    transition={networkLayoutTransition}
                    className="relative text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                        {lead}
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
                      <button type="button" onClick={handleNetworkExpand} onKeyDown={onTriggerKeyDown}>
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
                key="travel-network-body"
                id="travel-network-body"
                className="space-y-6"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-6" variants={bodyGroup}>
                  <motion.div variants={bodyItem}>
                    <LayoutGroup id="experience-travel-network-tabs">
                      <div
                        role="tablist"
                        aria-label="Experience travel and support tabs"
                        className="flex flex-wrap gap-2 md:gap-3"
                      >
                        {tabs.map((tab) => {
                          const isActive = activeTab === tab.key;
                          return (
                            <motion.button
                              key={tab.key}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              className={cn(
                                "group relative overflow-hidden type-label-tight pill border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring",
                                isActive ? "text-perazzi-white" : "text-ink",
                              )}
                              onClick={() => { setActiveTab(tab.key); }}
                              initial={false}
                              whileHover={motionEnabled ? { x: 2, transition: homeMotion.micro } : undefined}
                              whileTap={motionEnabled ? { x: 0, transition: homeMotion.micro } : undefined}
                            >
                              {isActive ? (
                                motionEnabled ? (
                                  <motion.span
                                    layoutId="experience-travel-network-tab-highlight"
                                    className="absolute inset-0 rounded-sm bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                    transition={homeMotion.springHighlight}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <span
                                    className="absolute inset-0 rounded-sm bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                    aria-hidden="true"
                                  />
                                )
                              ) : null}
                              <span className="relative z-10">
                                {tab.label}
                                <span className={cn("ml-2 type-caption", isActive ? "text-white/75" : "text-ink-muted")}>
                                  ({tab.count})
                                </span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </LayoutGroup>
                  </motion.div>

                  <motion.div variants={bodyItem}>
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.div
                        key={activeTab}
                        initial={motionEnabled ? { opacity: 0, y: 10 } : false}
                        animate={motionEnabled ? { opacity: 1, y: 0 } : undefined}
                        exit={motionEnabled ? { opacity: 0, y: -10 } : undefined}
                        transition={motionEnabled ? homeMotion.revealFast : undefined}
                      >
                        {activeTab === "schedule" ? (
                          <ScheduleList
                            events={data.scheduledEvents}
                            emptyText={emptyScheduleText}
                            listReveal={listReveal}
                          />
                        ) : (
                          <DealerList
                            dealers={data.dealers}
                            emptyText={emptyDealersText}
                            listReveal={listReveal}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
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

function ScheduleList({ events, emptyText, listReveal }: ScheduleListProps) {
  const { phase, motionEnabled, listGroup, listItem } = listReveal;
  if (!events.length) {
    return (
      <Text size="md" muted>
        {emptyText}
      </Text>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={motionEnabled ? "collapsed" : false}
      animate={motionEnabled ? phase : undefined}
      variants={listGroup}
    >
      {events.map((event) => (
        <motion.article
          key={event._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated md:p-6 lg:p-7"
          variants={listItem}
        >
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <Text className="type-button text-ink-muted">
            {formatDateRange(event.startDate, event.endDate)}
          </Text>
          <Heading level={3} className="mt-2 mb-7 type-card-title text-ink text-3xl">
            {event.eventName}
          </Heading>
          <Text className="type-card-title text-ink-muted">
            {event.eventLocation}
          </Text>
          {event.location ? (
            <Text size="md" muted className="mt-2">
              {event.location}
            </Text>
          ) : null}
        </motion.article>
      ))}
    </motion.div>
  );
}

function DealerList({ dealers, emptyText, listReveal }: DealerListProps) {
  const { phase, motionEnabled, listGroup, listItem } = listReveal;
  if (!dealers.length) {
    return (
      <Text size="md" muted>
        {emptyText}
      </Text>
    );
  }

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2"
      initial={motionEnabled ? "collapsed" : false}
      animate={motionEnabled ? phase : undefined}
      variants={listGroup}
    >
      {dealers.map((dealer) => (
        <motion.article
          key={dealer._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
          variants={listItem}
        >
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <Heading level={3} className="mb-7 type-card-title text-ink text-3xl">
            {dealer.dealerName}
          </Heading>
          <Text className="type-button text-ink-muted">
            {dealer.state}
          </Text>
          <Text asChild className="mt-2 type-body text-ink-muted">
            <p>
              {dealer.address}
              <br />
              {dealer.city}
            </p>
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "Dates TBA";

  const format = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(value))
      : null;

  const startDate = format(start);
  const endDate = format(end);

  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate ?? endDate ?? "Dates TBA";
}
