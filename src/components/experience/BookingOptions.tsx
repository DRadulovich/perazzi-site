"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
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
  const [showScheduler, setShowScheduler] = useState(false);

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
      <div className="grid gap-6 md:grid-cols-3">
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
                className="prose prose-sm max-w-none text-ink-muted"
                dangerouslySetInnerHTML={{ __html: option.descriptionHtml }}
              />
            </div>
            <div className="mt-auto pt-6">
              <Button
                asChild
                variant="secondary"
                size="lg"
                onClick={() =>
                  console.log(`[analytics] FittingCtaClick:${option.id}`)
                }
              >
                <a href={option.href}>Reserve this session</a>
              </Button>
            </div>
          </article>
        ))}
      </div>
      {scheduler ? (
        <div className="space-y-3 rounded-3xl border border-border/70 bg-card/70 p-6">
          <h3 className="text-lg font-semibold text-ink">
            Schedule with concierge
          </h3>
          {showScheduler ? (
            <iframe
              id="experience-scheduler-iframe"
              src={scheduler.src}
              title={scheduler.title}
              className="h-[480px] w-full rounded-2xl border border-border"
              loading="lazy"
            />
          ) : (
            <Button
              variant="primary"
              aria-controls="experience-scheduler-iframe"
              onClick={() => {
                setShowScheduler(true);
              }}
            >
              Load scheduler
            </Button>
          )}
          <p className="text-xs text-ink-muted">
            Prefer email?{" "}
            <a
              href={scheduler.fallbackHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-perazzi-red focus-ring"
            >
              Open the scheduler
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      ) : null}
    </section>
  );
}
