"use client";

import { useMemo, useState } from "react";

import type {
  AuthorizedDealerEntry,
  ExperienceNetworkData,
  RecommendedServiceCenterEntry,
  ScheduledEventEntry,
} from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type TabKey = "schedule" | "dealers" | "service";

type TravelNetworkProps = {
  data: ExperienceNetworkData;
};

export function TravelNetwork({ data }: TravelNetworkProps) {
  const analyticsRef = useAnalyticsObserver("TravelNetworkSeen");
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");

  const tabs = useMemo(
    () => [
      {
        key: "schedule" as const,
        label: "Our Travel Schedule",
        count: data.scheduledEvents.length,
      },
      {
        key: "dealers" as const,
        label: "Our Dealers",
        count: data.dealers.length,
      },
      {
        key: "service" as const,
        label: "Service Centers",
        count: data.serviceCenters.length,
      },
    ],
    [data.dealers.length, data.scheduledEvents.length, data.serviceCenters.length],
  );

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="travel-network-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Travel & service
        </p>
        <h2 id="travel-network-heading" className="text-2xl font-semibold text-ink">
          Meet us on the road
        </h2>
        <p className="text-base text-ink-muted md:text-lg">
          Track our travel schedule, connect with a trusted Perazzi dealer, or schedule service with
          the partners closest to you.
        </p>
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
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring",
              activeTab === tab.key
                ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                : "border-border bg-card text-ink",
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="ml-2 text-[0.8em] text-ink-muted">({tab.count})</span>
          </button>
        ))}
      </div>
      <div>
        {activeTab === "schedule" && <ScheduleList events={data.scheduledEvents} />}
        {activeTab === "dealers" && <DealerList dealers={data.dealers} />}
        {activeTab === "service" && <ServiceCenterList centers={data.serviceCenters} />}
      </div>
    </section>
  );
}

function ScheduleList({ events }: { events: ScheduledEventEntry[] }) {
  if (!events.length) {
    return <p className="text-sm text-ink-muted">New travel stops are being confirmed. Check back shortly.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <article
          key={event._id}
          className="rounded-2xl border border-border/70 bg-card/70 p-4 md:p-6 lg:p-8"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {formatDateRange(event.startDate, event.endDate)}
          </p>
          <h3 className="text-lg font-semibold text-ink">{event.eventName}</h3>
          <p className="text-sm text-ink-muted">{event.eventLocation}</p>
          {event.location ? (
            <p className="mt-2 text-sm text-ink-muted">{event.location}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function DealerList({ dealers }: { dealers: AuthorizedDealerEntry[] }) {
  if (!dealers.length) {
    return <p className="text-sm text-ink-muted">Dealer roster is being configured in Sanity.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {dealers.map((dealer) => (
        <article key={dealer._id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <h3 className="text-base font-semibold text-ink">{dealer.dealerName}</h3>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">{dealer.state}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {dealer.address}
            <br />
            {dealer.city}
          </p>
        </article>
      ))}
    </div>
  );
}

function ServiceCenterList({ centers }: { centers: RecommendedServiceCenterEntry[] }) {
  if (!centers.length) {
    return <p className="text-sm text-ink-muted">Service partners are being published. Please check back soon.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {centers.map((center) => (
        <article key={center._id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <h3 className="text-base font-semibold text-ink">{center.centerName}</h3>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">{center.state}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {center.address}
            <br />
            {center.city}
          </p>
          <p className="mt-2 text-sm text-ink">
            <span className="font-semibold">Contact:</span> {center.contact}
          </p>
          <p className="text-sm text-ink">
            <span className="font-semibold">Phone:</span> {center.phone}
          </p>
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
