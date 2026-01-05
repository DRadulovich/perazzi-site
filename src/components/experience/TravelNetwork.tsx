"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AuthorizedDealerEntry,
  ExperienceNetworkData,
  ScheduledEventEntry,
  TravelNetworkUi,
} from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Container,
  Heading,
  RevealCollapsedHeader,
  RevealExpandedHeader,
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
  const enableTitleReveal = isDesktop;
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
        isCollapsed
          ? "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:content-['']"
          : null,
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
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealNetwork,
    deps: [activeTab, data.dealers.length, data.scheduledEvents.length],
  });
  const showExpanded = revealNetwork || isPreparing;

  const handleNetworkExpand = () => {
    if (!enableTitleReveal) return;
    beginExpand(() => {
      setNetworkExpanded(true);
      setHeaderThemeReady(true);
      onCollapsedChange?.(false);
    });
  };

  const handleNetworkCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setNetworkExpanded(false);
    onCollapsedChange?.(true);
  };

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealNetwork}
        revealOverlay={revealPhotoFocus}
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
          {showExpanded ? (
            <div className={isPreparing ? "section-reveal-measure" : undefined}>
              <RevealExpandedHeader
                headingId="travel-network-heading"
                heading={heading}
                headerThemeReady={headerThemeReady}
                enableTitleReveal={enableTitleReveal}
                onCollapse={handleNetworkCollapse}
              >
                <div className="relative">
                  <Text
                    className={cn(
                      "type-section-subtitle",
                      headerThemeReady ? "text-ink-muted" : "text-white",
                    )}
                    leading="relaxed"
                  >
                    {lead}
                  </Text>
                </div>
                <div>
                  <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                    {supporting}
                  </Text>
                </div>
              </RevealExpandedHeader>

              <div id="travel-network-body" className="space-y-6">
                <div
                  role="tablist"
                  aria-label="Experience travel and support tabs"
                  className="flex flex-wrap gap-2 md:gap-3"
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
                          <span
                            className="absolute inset-0 rounded-sm bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                            aria-hidden="true"
                          />
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
                </div>

                <div>
                  <div key={activeTab}>
                    {activeTab === "schedule" ? (
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
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <RevealCollapsedHeader
              headingId="travel-network-heading"
              heading={heading}
              subheading={lead}
              controlsId="travel-network-body"
              expanded={revealNetwork}
              onExpand={handleNetworkExpand}
            />
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
    <div className="space-y-4">
      {events.map((event) => (
        <article
          key={event._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 hover:border-ink/20 hover:bg-card/80 sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated md:p-6 lg:p-7"
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
        </article>
      ))}
    </div>
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
    <div className="grid gap-4 md:grid-cols-2">
      {dealers.map((dealer) => (
        <article
          key={dealer._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 hover:border-ink/20 hover:bg-card/80 sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
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
        </article>
      ))}
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
