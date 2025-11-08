"use client";

import { useState } from "react";
import type { DemoProgramData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";

type DemoProgramProps = {
  demo: DemoProgramData;
};

export function DemoProgram({ demo }: DemoProgramProps) {
  const analyticsRef = useAnalyticsObserver("DemoProgramSeen");
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const events = demo.events ?? [];
  const filteredEvents = activeCity
    ? events.filter((event) => event.cityState.includes(activeCity))
    : events;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="DemoProgramSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="demo-program-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Demo program
        </p>
        <h2
          id="demo-program-heading"
          className="text-2xl font-semibold text-ink"
        >
          Meet us on the road
        </h2>
        <div
          className="prose prose-base max-w-none text-ink-muted md:prose-lg md:max-w-3xl lg:max-w-4xl"
          dangerouslySetInnerHTML={{ __html: demo.introHtml }}
        />
      </div>
      {events.length ? (
        <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4" aria-label="Filter by city" role="group">
          <button
            type="button"
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring",
              activeCity === null
                ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                : "border-border bg-card text-ink",
            )}
            onClick={() => setActiveCity(null)}
          >
            All cities
          </button>
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring",
                activeCity === event.cityState
                  ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                  : "border-border bg-card text-ink",
              )}
              onClick={() =>
                setActiveCity(activeCity === event.cityState ? null : event.cityState)
              }
            >
              {event.cityState}
            </button>
          ))}
        </div>
      ) : null}
      <div className="space-y-4">
        {filteredEvents.length ? (
          filteredEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-border/70 bg-card/70 p-4 md:p-6 lg:p-8"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {new Date(event.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h3 className="text-lg font-semibold text-ink">{event.clubName}</h3>
              <p className="text-sm text-ink-muted">{event.cityState}</p>
              {event.href ? (
                <a
                  href={event.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
                  onClick={() =>
                    logAnalytics(`DemoEventOpen:${event.id}`)
                  }
                >
                  Event details
                  <span aria-hidden="true">→</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-ink-muted">
            More demo events are being scheduled. Request a stop to bring the tour to your club.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <div
          className="rounded-2xl border border-border/60 bg-card/60 p-4 text-sm text-ink-muted md:p-6 lg:p-7"
          dangerouslySetInnerHTML={{ __html: demo.whatToExpectHtml ?? "" }}
        />
        <Button
          asChild
          size="lg"
          onClick={() => logAnalytics("DemoRequestClick")}
        >
          <a href={demo.requestCta.href}>{demo.requestCta.label}</a>
        </Button>
      </div>
    </section>
  );
}
