"use client";

import { useMemo, useState } from "react";

import type { AuthorizedDealerEntry, ExperienceNetworkData, ScheduledEventEntry } from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import Image from "next/image";

type TabKey = "schedule" | "dealers";

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
    ],
    [data.dealers.length, data.scheduledEvents.length],
  );

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="travel-network-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg"
          alt="Perazzi travel network background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-[color:var(--scrim-soft)]"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          <div className="space-y-3">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              Travel network
            </p>
            <h2
              id="travel-network-heading"
              className="text-sm sm:text-base font-light italic leading-relaxed text-ink-muted"
            >
              Meet us on the road
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-ink-muted">
              Track our travel schedule or connect with a trusted Perazzi dealer closest to you.
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
                  "rounded-full border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition",
                  activeTab === tab.key
                    ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                    : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
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
          </div>
        </div>
      </div>
    </section>
  );
}

function ScheduleList({ events }: { events: ScheduledEventEntry[] }) {
  if (!events.length) {
    return <p className="text-sm leading-relaxed text-ink-muted">New travel stops are being confirmed. Check back shortly.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <article
          key={event._id}
          className="rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm sm:rounded-3xl md:p-6 lg:p-7"
        >
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            {formatDateRange(event.startDate, event.endDate)}
          </p>
          <h3 className="mt-2 text-base sm:text-lg font-semibold text-ink">
            {event.eventName}
          </h3>
          <p className="text-sm leading-relaxed text-ink-muted">
            {event.eventLocation}
          </p>
          {event.location ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {event.location}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function DealerList({ dealers }: { dealers: AuthorizedDealerEntry[] }) {
  if (!dealers.length) {
    return <p className="text-sm leading-relaxed text-ink-muted">Dealer roster is being configured in Sanity.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {dealers.map((dealer) => (
        <article key={dealer._id} className="rounded-2xl border border-border/75 bg-card/75 p-4 shadow-sm sm:rounded-3xl">
          <h3 className="text-base font-semibold text-ink">{dealer.dealerName}</h3>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            {dealer.state}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {dealer.address}
            <br />
            {dealer.city}
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
