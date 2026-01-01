"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

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
}>;

type ScheduleListProps = Readonly<{
  events: readonly ScheduledEventEntry[];
  emptyText: string;
}>;

type DealerListProps = Readonly<{
  dealers: readonly AuthorizedDealerEntry[];
  emptyText: string;
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
      />
    </section>
  );
}

const TravelNetworkRevealSection = ({
  data,
  ui,
  enableTitleReveal,
  motionEnabled,
}: TravelNetworkRevealSectionProps) => {
  const [networkExpanded, setNetworkExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const networkShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

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

  const revealNetwork = !enableTitleReveal || networkExpanded;
  const revealPhotoFocus = revealNetwork;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition =
    "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition =
    "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const networkReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const networkRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const networkCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const networkBodyReveal = networkReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: networkReveal.duration }
    : undefined;
  const networkLayoutTransition = motionEnabled ? { layout: networkReveal } : undefined;
  const networkMinHeight = enableTitleReveal ? "min-h-[calc(720px+16rem)]" : null;

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: networkReveal },
  } as const;

  const handleNetworkExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setNetworkExpanded(true);
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
    setNetworkExpanded(false);
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
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={background.url}
          alt={background.alt ?? "Perazzi travel network background"}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-soft)",
            focusFadeTransition,
            revealNetwork ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-soft)",
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
          ref={networkShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            networkMinHeight,
          )}
        >
          <LayoutGroup id="experience-travel-network-title">
            <AnimatePresence initial={false}>
              {revealNetwork ? (
                <motion.div
                  key="travel-network-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: networkReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: networkRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
                    <motion.div
                      layoutId="travel-network-title"
                      layoutCrossfade={false}
                      transition={networkLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="travel-network-heading"
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
                      layoutId="travel-network-subtitle"
                      layoutCrossfade={false}
                      transition={networkLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Text
                          className={cn(
                            "type-section-subtitle",
                            titleColorTransition,
                            headerThemeReady ? "text-ink-muted" : "text-white",
                          )}
                          leading="relaxed"
                        >
                          {lead}
                        </Text>
                      </motion.div>
                    </motion.div>
                    <motion.div variants={headingItem}>
                      <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                        {supporting}
                      </Text>
                    </motion.div>
                  </motion.div>
                  {enableTitleReveal ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleNetworkCollapse}
                    >
                      Collapse
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="travel-network-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                  exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                  transition={motionEnabled ? networkRevealFast : undefined}
                >
                  <motion.div
                    layoutId="travel-network-title"
                    layoutCrossfade={false}
                    transition={networkLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <Heading
                      id="travel-network-heading"
                      level={2}
                      size="xl"
                      className="type-section-collapsed"
                    >
                      {heading}
                    </Heading>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onPointerEnter={handleNetworkExpand}
                      onFocus={handleNetworkExpand}
                      onClick={handleNetworkExpand}
                      aria-expanded={revealNetwork}
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
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {lead}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: networkRevealFast } : undefined}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleNetworkExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealNetwork ? (
              <motion.div
                key="travel-network-body"
                id="travel-network-body"
                className="space-y-6"
                initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, filter: "blur(0px)", transition: networkBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, filter: "blur(10px)", transition: networkCollapse }
                    : undefined
                }
              >
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

                <div>
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                      key={activeTab}
                      initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={motionEnabled ? { opacity: 0, y: -14, filter: "blur(10px)" } : undefined}
                      transition={motionEnabled ? homeMotion.revealFast : undefined}
                    >
                      {activeTab === "schedule" ? (
                        <ScheduleList
                          events={data.scheduledEvents}
                          emptyText={emptyScheduleText}
                          motionEnabled={motionEnabled}
                        />
                      ) : (
                        <DealerList
                          dealers={data.dealers}
                          emptyText={emptyDealersText}
                          motionEnabled={motionEnabled}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </Container>
    </>
  );
};

function ScheduleList({ events, emptyText, motionEnabled }: ScheduleListProps & { motionEnabled: boolean }) {
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
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
      }}
    >
      {events.map((event) => (
        <motion.article
          key={event._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated md:p-6 lg:p-7"
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
          }}
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

function DealerList({ dealers, emptyText, motionEnabled }: DealerListProps & { motionEnabled: boolean }) {
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
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
      }}
    >
      {dealers.map((dealer) => (
        <motion.article
          key={dealer._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
          }}
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
