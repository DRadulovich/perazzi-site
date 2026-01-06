"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AuthorizedDealerEntry,
  ExperienceNetworkData,
  ScheduledEventEntry,
  TravelNetworkUi,
} from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  buildChoreoPresenceVars,
  choreoDistance,
  dreamyPace,
  prefersReducedMotion,
  type ChoreoPresenceState,
} from "@/lib/choreo";
import {
  ChoreoGroup,
  ChoreoPresence,
  Container,
  Heading,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

type TabKey = "schedule" | "dealers";

type TravelNetworkProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
}>;

type TravelNetworkRevealSectionProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
  enableTitleReveal: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}>;

type TravelNetworkBackground = Readonly<{
  url: string;
  alt: string;
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const enableTitleReveal = isHydrated && isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const travelKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
      aria-labelledby="travel-network-heading"
    >
      <TravelNetworkRevealSection
        key={travelKey}
        data={data}
        ui={ui}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

const TravelNetworkRevealSection = ({
  data,
  ui,
  enableTitleReveal,
  onCollapsedChange,
}: TravelNetworkRevealSectionProps) => {
  const [networkExpanded, setNetworkExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const reduceMotion = prefersReducedMotion();
  const [displayTab, setDisplayTab] = useState<TabKey>("schedule");
  const [presenceState, setPresenceState] = useState<ChoreoPresenceState>("enter");
  const presenceTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

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
  const background: TravelNetworkBackground = {
    url: ui.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg",
    alt: ui.backgroundImage?.alt ?? "Perazzi travel network background",
  };
  const emptyScheduleText =
    ui.emptyScheduleText ?? "New travel stops are being confirmed. Check back shortly.";
  const emptyDealersText = ui.emptyDealersText ?? "Dealer roster is being configured in Sanity.";

  const revealNetwork = !enableTitleReveal || networkExpanded;
  const revealPhotoFocus = revealNetwork;
  const networkMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: networkShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealNetwork,
    deps: [activeTab, data.dealers.length, data.scheduledEvents.length],
  });
  const listPresenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterY: 24,
    exitY: -80,
    enterScale: 0.98,
    exitScale: 0.98,
  });
  const tabUnderlayVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterScale: 0.98,
    exitScale: 0.98,
    enterY: 0,
    exitY: 0,
  });

  const handleNetworkExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setNetworkExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleNetworkCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setNetworkExpanded(false);
    onCollapsedChange?.(true);
  };

  useEffect(() => (
    () => {
      if (presenceTimeoutRef.current) {
        globalThis.clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
      if (exitTimeoutRef.current) {
        globalThis.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
  ), []);

  useEffect(() => {
    if (activeTab === displayTab) return;
    if (presenceTimeoutRef.current) {
      globalThis.clearTimeout(presenceTimeoutRef.current);
      presenceTimeoutRef.current = null;
    }
    if (exitTimeoutRef.current) {
      globalThis.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (reduceMotion) {
      presenceTimeoutRef.current = globalThis.setTimeout(() => {
        setDisplayTab(activeTab);
        setPresenceState("enter");
        presenceTimeoutRef.current = null;
      }, 0);
      return;
    }

    exitTimeoutRef.current = globalThis.setTimeout(() => {
      setPresenceState("exit");
      exitTimeoutRef.current = null;
    }, 0);
    presenceTimeoutRef.current = globalThis.setTimeout(() => {
      setDisplayTab(activeTab);
      setPresenceState("enter");
      presenceTimeoutRef.current = null;
    }, dreamyPace.staggerMs);
  }, [activeTab, displayTab, reduceMotion]);

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <TravelNetworkExpandedHeader
          headingId="travel-network-heading"
          heading={heading}
          lead={lead}
          supporting={supporting}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={handleNetworkCollapse}
        />
      </RevealItem>

      <RevealGroup delayMs={140}>
        <div id="travel-network-body" className="space-y-6">
          <RevealItem index={0}>
            <ChoreoGroup
              effect="slide"
              axis="x"
              direction="right"
              distance={choreoDistance.base}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              staggerMs={dreamyPace.staggerMs}
              className="flex flex-wrap gap-2 md:gap-3"
              itemAsChild
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      "group relative overflow-hidden type-label-tight pill border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 focus-ring",
                      isActive ? "text-perazzi-white" : "text-ink",
                    )}
                    onClick={() => { setActiveTab(tab.key); }}
                  >
                    {isActive ? (
                      <ChoreoPresence
                        state="enter"
                        style={tabUnderlayVars}
                        asChild
                      >
                        <span
                          className="absolute inset-0 rounded-sm bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                          aria-hidden="true"
                        />
                      </ChoreoPresence>
                    ) : null}
                    <span className="relative z-10">
                      {tab.label}
                      <span className={cn("ml-2 type-caption", isActive ? "text-white/75" : "text-ink-muted")}>
                        ({tab.count})
                      </span>
                    </span>
                  </button>
                );
              })}
            </ChoreoGroup>
          </RevealItem>

          <RevealItem index={1}>
            <div>
              <ChoreoPresence
                state={presenceState}
                style={listPresenceVars}
              >
                {displayTab === "schedule" ? (
                  <ScheduleList
                    events={data.scheduledEvents}
                    emptyText={emptyScheduleText}
                  />
                ) : (
                  <DealerList
                    dealers={data.dealers}
                    emptyText={emptyDealersText}
                  />
                )}
              </ChoreoPresence>
            </div>
          </RevealItem>
        </div>
      </RevealGroup>
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealNetwork}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealNetwork}
        overlay="canvas"
        loading="lazy"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={networkShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={networkMinHeight ?? undefined}
        >
          {revealNetwork ? (
            expandedContent
          ) : (
            <>
              <ChoreoGroup
                effect="fade-lift"
                distance={choreoDistance.base}
                durationMs={dreamyPace.textMs}
                easing={dreamyPace.easing}
                staggerMs={dreamyPace.staggerMs}
                itemClassName="absolute inset-0"
              >
                <RevealCollapsedHeader
                  headingId="travel-network-heading"
                  heading={heading}
                  subheading={lead}
                  controlsId="travel-network-body"
                  expanded={revealNetwork}
                  onExpand={handleNetworkExpand}
                />
              </ChoreoGroup>
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

function ScheduleList({ events, emptyText }: ScheduleListProps) {
  if (!events.length) {
    return (
      <Text size="md" muted>
        {emptyText}
      </Text>
    );
  }

  return (
    <ChoreoGroup
      effect="fade-lift"
      distance={choreoDistance.base}
      durationMs={dreamyPace.textMs}
      easing={dreamyPace.easing}
      staggerMs={dreamyPace.staggerMs}
      className="space-y-4"
      itemAsChild
    >
      {events.map((event) => (
        <article
          key={event._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 hover:border-ink/20 hover:bg-card/80 sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated md:p-6 lg:p-7"
        >
          <ChoreoGroup
            effect="fade-lift"
            distance={choreoDistance.tight}
            durationMs={dreamyPace.textMs}
            easing={dreamyPace.easing}
            staggerMs={dreamyPace.staggerMs}
            itemAsChild
          >
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
          </ChoreoGroup>
        </article>
      ))}
    </ChoreoGroup>
  );
}

function DealerList({ dealers, emptyText }: DealerListProps) {
  if (!dealers.length) {
    return (
      <Text size="md" muted>
        {emptyText}
      </Text>
    );
  }

  return (
    <ChoreoGroup
      effect="fade-lift"
      distance={choreoDistance.base}
      durationMs={dreamyPace.textMs}
      easing={dreamyPace.easing}
      staggerMs={dreamyPace.staggerMs}
      className="grid gap-4 md:grid-cols-2"
      itemAsChild
    >
      {dealers.map((dealer) => (
        <article
          key={dealer._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 hover:border-ink/20 hover:bg-card/80 sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
        >
          <ChoreoGroup
            effect="fade-lift"
            distance={choreoDistance.tight}
            durationMs={dreamyPace.textMs}
            easing={dreamyPace.easing}
            staggerMs={dreamyPace.staggerMs}
            itemAsChild
          >
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
          </ChoreoGroup>
        </article>
      ))}
    </ChoreoGroup>
  );
}

type TravelNetworkExpandedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  lead: string;
  supporting: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
  collapseLabel?: string;
}>;

function TravelNetworkExpandedHeader({
  headingId,
  heading,
  lead,
  supporting,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
}: TravelNetworkExpandedHeaderProps) {
  const headingClass = headerThemeReady ? "text-ink" : "text-white";
  const leadClass = headerThemeReady ? "text-ink-muted" : "text-white";
  const supportingClass = headerThemeReady ? "text-ink-muted" : "text-white/80";

  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
      >
        <div className="relative">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className={headingClass}
          >
            {heading}
          </Heading>
        </div>
        <div className="relative">
          <Text
            className={cn("type-section-subtitle", leadClass)}
            leading="relaxed"
          >
            {lead}
          </Text>
        </div>
        <div className="relative">
          <Text className={cn("type-section-subtitle", supportingClass)} leading="relaxed">
            {supporting}
          </Text>
        </div>
      </ChoreoGroup>
      {enableTitleReveal ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          delayMs={dreamyPace.staggerMs}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          itemAsChild
        >
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            {collapseLabel}
          </button>
        </ChoreoGroup>
      ) : null}
    </div>
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
