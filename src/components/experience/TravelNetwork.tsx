"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Image from "next/image";

import type {
  AuthorizedDealerEntry,
  ExperienceNetworkData,
  ScheduledEventEntry,
  TravelNetworkUi,
} from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ExpandableSection } from "@/motion/expandable/ExpandableSection";
import type { ExpandableSectionMotionApi } from "@/motion/expandable/expandable-section-motion";
import { Container, Heading, Text } from "@/components/ui";

type TabKey = "schedule" | "dealers";

type TravelNetworkProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
}>;

type TravelNetworkRevealSectionProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
  es: ExpandableSectionMotionApi;
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
  const travelKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  return (
    <ExpandableSection
      key={travelKey}
      sectionId="experience.travelNetwork"
      defaultExpanded={!enableTitleReveal}
      rootRef={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="travel-network-heading"
    >
      {(es) => (
        <TravelNetworkRevealSection
          data={data}
          ui={ui}
          es={es}
        />
      )}
    </ExpandableSection>
  );
}

const TravelNetworkRevealSection = ({
  data,
  ui,
  es,
}: TravelNetworkRevealSectionProps) => {
  const {
    getTriggerProps,
    getCloseProps,
    layoutProps,
    contentVisible,
    bodyId,
  } = es;

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
  const background = {
    url: ui.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg",
    alt: ui.backgroundImage?.alt ?? "Perazzi travel network background",
  };
  const emptyScheduleText =
    ui.emptyScheduleText ?? "New travel stops are being confirmed. Check back shortly.";
  const emptyDealersText = ui.emptyDealersText ?? "Dealer roster is being configured in Sanity.";

  const networkMinHeight = contentVisible ? null : "min-h-[calc(720px+16rem)]";
  const headerThemeReady = contentVisible;

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div data-es="bg" className="absolute inset-0">
          <Image
            src={background.url}
            alt={background.alt ?? "Perazzi travel network background"}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
            loading="lazy"
          />
        </div>
        <div
          data-es="scrim-bottom"
          className="absolute inset-0 bg-(--scrim-strong)"
          aria-hidden
        />
        <div
          data-es="scrim-top"
          className="pointer-events-none absolute inset-0 overlay-gradient-canvas"
          aria-hidden
        />
      </div>

      <Container size="xl" className="relative z-10">
        <motion.div {...layoutProps} className={cn("relative", networkMinHeight)}>
          <div
            data-es="glass"
            className={cn(
              "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
              contentVisible
                ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            )}
          >
            {contentVisible ? (
              <>
                <div data-es="header-expanded" className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
                  <div className="space-y-3">
                    <div className="relative">
                      <Heading
                        id="travel-network-heading"
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
                        {lead}
                      </Text>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-es="close"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                    {...getCloseProps()}
                  >
                    Collapse
                  </button>
                </div>

                <div data-es="body" id={bodyId}>
                  <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                    {supporting}
                  </Text>
                </div>

                <div data-es="main" className="space-y-6">
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

                <div data-es="cta" className="sr-only">
                  Explore travel dates and dealer network.
                </div>
              </>
            ) : null}
          </div>

          <div
            data-es="header-collapsed"
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center",
              contentVisible && "pointer-events-none",
            )}
            aria-hidden={contentVisible}
          >
            <div className="relative inline-flex text-white">
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
                aria-labelledby="travel-network-heading"
                {...getTriggerProps({ kind: "header", withHover: true })}
              >
                <span className="sr-only">Expand {heading}</span>
              </button>
            </div>
            <div className="relative text-white">
              <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                {lead}
              </Text>
            </div>
            <div className="mt-3">
              <Text
                size="button"
                className="text-white/80 cursor-pointer focus-ring"
                asChild
              >
                <button type="button" {...getTriggerProps({ kind: "cta" })}>
                  Read more
                </button>
              </Text>
            </div>
          </div>
        </motion.div>
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
    <div data-es="list" className="space-y-4">
      {events.map((event) => (
        <article
          key={event._id}
          data-es="item"
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
    <div data-es="list" className="grid gap-4 md:grid-cols-2">
      {dealers.map((dealer) => (
        <article
          key={dealer._id}
          data-es="item"
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
