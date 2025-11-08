"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import type { FittingOption } from "@/types/experience";

type BookingOptionsProps = {
  options: FittingOption[];
  scheduler?: {
    title: string;
    src: string;
    fallbackHref: string;
  };
};

export function BookingOptions({ options, scheduler }: BookingOptionsProps) {
  const analyticsRef = useAnalyticsObserver("ExperienceBookingSeen");
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerLoaded, setSchedulerLoaded] = useState(false);
  const schedulerPanelId = "experience-scheduler-panel";
  const schedulerNoteId = "experience-scheduler-note";

  if (!options.length) return null;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ExperienceBookingSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="experience-booking-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Book a fitting
        </p>
        <h2
          id="experience-booking-heading"
          className="text-2xl font-semibold text-ink"
        >
          Choose the session that fits your journey
        </h2>
      </div>
      <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <article
            key={option.id}
            className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-ink">{option.title}</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {option.durationMins} minutes
              </p>
              <div
                className="prose prose-base max-w-none text-ink-muted md:prose-lg"
                dangerouslySetInnerHTML={{ __html: option.descriptionHtml }}
              />
            </div>
            <div className="mt-auto pt-6">
              <Button
                asChild
                variant="secondary"
                size="lg"
                onClick={() =>
                  logAnalytics(`FittingCtaClick:${option.id}`)
                }
              >
                <a href={option.href}>Reserve this session</a>
              </Button>
            </div>
          </article>
        ))}
      </div>
      {scheduler ? (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">
              Schedule with concierge
            </h3>
            <Button
              variant="primary"
              size="sm"
              aria-controls={schedulerPanelId}
              aria-expanded={schedulerOpen}
              aria-describedby={schedulerNoteId}
              onClick={() => {
                setSchedulerOpen((prev) => {
                  const next = !prev;
                  if (next && !schedulerLoaded) {
                    setSchedulerLoaded(true);
                  }
                  logAnalytics(
                    `ExperienceScheduler:${next ? "open" : "close"}`,
                  );
                  return next;
                });
              }}
            >
              {schedulerOpen ? "Hide scheduler" : "Begin Your Fitting"}
            </Button>
          </div>
          <p id={schedulerNoteId} className="sr-only">
            Selecting Begin Your Fitting loads an embedded booking form below.
          </p>
          <div
            id={schedulerPanelId}
            className="rounded-2xl border border-border/70 bg-card/60 p-3"
            aria-live="polite"
          >
            {schedulerLoaded ? (
              <iframe
                src={scheduler.src}
                title={`Booking — ${scheduler.title}`}
                className={`h-[480px] w-full rounded-2xl border border-border ${schedulerOpen ? "" : "hidden"}`}
                loading="lazy"
                aria-hidden={!schedulerOpen}
                tabIndex={schedulerOpen ? 0 : -1}
              />
            ) : (
              <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-ink-muted">
                The booking form appears here once you choose Begin Your Fitting.
              </div>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Prefer email?{" "}
            <a
              href={scheduler.fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-perazzi-red focus-ring"
            >
              Open booking in a new tab
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      ) : null}
    </section>
  );
}
