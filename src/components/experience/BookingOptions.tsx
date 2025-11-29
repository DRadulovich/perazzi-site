"use client";

import { useState } from "react";
import Image from "next/image";
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
      className="relative isolate w-screen overflow-hidden py-16 sm:py-20"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="experience-booking-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/redesign-photos/experience/pweb-experience-bookingoptions-bg.jpg"
          alt="Perazzi booking options background"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
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
        <div className="space-y-6 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
          <div className="space-y-2">
            <p className="text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              Book a fitting
            </p>
            <h2
              id="experience-booking-heading"
              className="text-xl font-light italic text-ink-muted mb-4"
            >
              Choose the session that fits your journey
            </h2>
          </div>
          <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-3">
            {options.map((option) => (
              <article
                key={option.id}
                className="flex h-full flex-col rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm md:p-7 lg:p-8"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-ink">{option.title}</h3>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                    {option.durationMins} minutes
                  </p>
                  <div
                    className="prose prose-base max-w-none text-ink-muted md:prose-lg prose-headings:text-ink prose-strong:text-ink"
                    dangerouslySetInnerHTML={{ __html: option.descriptionHtml }}
                  />
                </div>
                <div className="mt-auto pt-6">
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em]"
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
            <div className="space-y-4 rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm md:p-8 lg:p-10">
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
                  className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
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
                className="rounded-2xl border border-border/70 bg-card/60 p-3 md:p-4 lg:p-5"
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
        </div>
      </div>
    </section>
  );
}
