"use client";

import { useMemo, useState } from "react";

import type { AuthorizedDealerEntry, ExperienceNetworkData, ScheduledEventEntry, TravelNetworkUi } from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Container, Heading, Section, Text } from "@/components/ui";
import Image from "next/image";

type TabKey = "schedule" | "dealers";

type TravelNetworkProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
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
  const backgroundSrc = ui.backgroundImage?.url
    ?? "/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg";
  const backgroundAlt = ui.backgroundImage?.alt ?? "Perazzi travel network background";
  const emptyScheduleText =
    ui.emptyScheduleText ?? "New travel stops are being confirmed. Check back shortly.";
  const emptyDealersText = ui.emptyDealersText ?? "Dealer roster is being configured in Sanity.";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="travel-network-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={backgroundSrc}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-(--scrim-soft)"
          aria-hidden
        />
        <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/40">
          <div className="space-y-3">
            <Heading
              id="travel-network-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
            <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
              {lead}
            </Text>
            <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
              {supporting}
            </Text>
          </div>

          <div
            role="tablist"
            aria-label="Experience travel and support tabs"
            className="flex flex-wrap gap-2 md:gap-3"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={cn(
                  "type-label-tight pill border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring",
                  activeTab === tab.key
                    ? "border-perazzi-red/60 bg-perazzi-red/10 text-perazzi-red"
                    : "text-ink",
                )}
                onClick={() => { setActiveTab(tab.key); }}
              >
                {tab.label}
                <span className="ml-2 type-caption text-ink-muted">({tab.count})</span>
              </button>
            ))}
          </div>

          <div>
            {activeTab === "schedule" && (
              <ScheduleList events={data.scheduledEvents} emptyText={emptyScheduleText} />
            )}
            {activeTab === "dealers" && (
              <DealerList dealers={data.dealers} emptyText={emptyDealersText} />
            )}
          </div>
        </Section>
      </Container>
    </section>
  );
}

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
          className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated md:p-6 lg:p-7"
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
        <article key={dealer._id} className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated">
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
    return `${startDate} – ${endDate}`;
  }

  return startDate ?? endDate ?? "Dates TBA";
}
