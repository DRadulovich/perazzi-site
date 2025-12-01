"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import Image from "next/image";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";

type VisitFactoryProps = {
  visitFactorySection: VisitFactoryData;
};

export function VisitFactory({ visitFactorySection }: VisitFactoryProps) {
  const analyticsRef = useAnalyticsObserver("VisitFactorySeen");
  const [mapOpen, setMapOpen] = useState(false);
  const [expectOpen, setExpectOpen] = useState(false);
  const mapPanelId = "visit-map-panel";
  const mapNoteId = "visit-map-note";
  const visit = visitFactorySection;
  const backgroundSrc = visit.backgroundImage?.url
    ?? "/redesign-photos/experience/pweb-experience-visitfactory-bg.jpg";
  const backgroundAlt = visit.backgroundImage?.alt ?? "Perazzi Botticino factory background";
  const mapHref =
    visit.location.mapLinkHref ??
    `https://maps.google.com/?q=${encodeURIComponent(visit.location.name)}`;
  const heading = visit.heading ?? "Visit Botticino";
  const subheading = visit.subheading ?? "See the factory in person";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="VisitFactorySeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="visit-factory-heading"
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
          <div className="space-y-2">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
              {heading}
            </p>
            <h2
              id="visit-factory-heading"
              className="mb-4 text-sm sm:text-base font-light italic leading-relaxed text-ink-muted"
            >
              {subheading}
            </h2>
            <div
              className="prose prose-base max-w-none leading-relaxed text-ink-muted md:prose-lg md:max-w-3xl lg:max-w-4xl prose-headings:text-ink prose-strong:text-ink"
              dangerouslySetInnerHTML={{ __html: visit.introHtml }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <article className="space-y-5 rounded-2xl border border-border/75 bg-card/75 p-5 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Botticino headquarters
              </p>
              <h3 className="text-base sm:text-lg font-semibold text-ink">
                {visit.location.name}
              </h3>
              <div
                className="text-sm leading-relaxed text-ink-muted"
                dangerouslySetInnerHTML={{ __html: visit.location.addressHtml }}
              />
              {visit.location.hoursHtml ? (
                <div
                  className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-ink-muted"
                  dangerouslySetInnerHTML={{ __html: visit.location.hoursHtml }}
                />
              ) : null}
              {visit.location.notesHtml ? (
                <div
                  className="text-sm leading-relaxed text-ink-muted"
                  dangerouslySetInnerHTML={{ __html: visit.location.notesHtml }}
                />
              ) : null}
              <div className="space-y-3 pt-2">
                <p id={mapNoteId} className="sr-only">
                  Selecting Open map loads an interactive map you can pan and zoom.
                </p>
                <div
                  id={mapPanelId}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-[color:var(--color-canvas)]"
                  style={{ aspectRatio: visit.location.staticMap.aspectRatio ?? 3 / 2 }}
                  aria-live="polite"
                >
                  {mapOpen && visit.location.mapEmbedSrc ? (
                    <iframe
                      src={visit.location.mapEmbedSrc}
                      title={`Map to ${visit.location.name}`}
                      className="h-full w-full"
                      loading="lazy"
                      aria-describedby={mapNoteId}
                    />
                  ) : (
                    <Image
                      src={visit.location.staticMap.url}
                      alt={visit.location.staticMap.alt}
                      fill
                      sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/70 via-[color:var(--scrim-strong)]/40 to-transparent"
                    aria-hidden
                  />
                </div>
                {!mapOpen && visit.location.mapEmbedSrc ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-controls={mapPanelId}
                    aria-describedby={mapNoteId}
                    aria-expanded={mapOpen}
                    onClick={() => {
                      setMapOpen(true);
                      logAnalytics("VisitMapOpen");
                    }}
                    className="rounded-full border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em]"
                  >
                    Open map
                  </Button>
                ) : null}
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
                >
                  Open in Maps
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </article>

            <div className="space-y-4">
              {visit.whatToExpectHtml ? (
                <Collapsible.Root open={expectOpen} onOpenChange={setExpectOpen}>
                  <Collapsible.Trigger
                    className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-ink focus-ring sm:rounded-3xl sm:border-border/70 sm:bg-card/75"
                    aria-expanded={expectOpen}
                    aria-controls="visit-expect-content"
                  >
                    What to expect
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-lg transition-transform",
                        expectOpen ? "rotate-45" : "rotate-0",
                      )}
                    >
                      +
                    </span>
                  </Collapsible.Trigger>
                  <Collapsible.Content
                    id="visit-expect-content"
                    className="mt-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-ink-muted shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card/75"
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: visit.whatToExpectHtml }}
                    />
                  </Collapsible.Content>
                </Collapsible.Root>
              ) : null}
              <Button
                asChild
                size="lg"
                onClick={() => logAnalytics("VisitCtaClick")}
                className="rounded-full px-6 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em]"
              >
                <a href={visit.cta.href}>{visit.cta.label}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
