"use client";

import { useState } from "react";
import Image from "next/image";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import SafeHtml from "@/components/SafeHtml";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Container, Heading, Section, Text } from "@/components/ui";

type VisitFactoryProps = {
  readonly visitFactorySection: VisitFactoryData;
};

export function VisitFactory({ visitFactorySection }: VisitFactoryProps) {
  const analyticsRef = useAnalyticsObserver("VisitFactorySeen");
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
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
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
          className="absolute inset-0 bg-(--scrim-soft)"
          aria-hidden
        />
        <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/40">
          <div className="space-y-2">
            <Heading
              id="visit-factory-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
            <Text size="md" className="type-section-subtitle text-ink-muted mb-4">
              {subheading}
            </Text>
            <SafeHtml
              className="prose-journal max-w-none text-ink-muted md:max-w-4xl lg:max-w-4xl"
              html={visit.introHtml}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <article className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 sm:rounded-3xl sm:bg-card/80 sm:p-6 sm:shadow-elevated lg:p-7">
              <Text size="label-tight" muted>
                Botticino headquarters
              </Text>
              <Heading level={3} size="sm" className="type-card-title text-ink">
                {visit.location.name}
              </Heading>
              <SafeHtml
                className="type-card-body text-ink-muted"
                html={visit.location.addressHtml}
              />
              {visit.location.hoursHtml ? (
                <SafeHtml
                  className="type-label-tight text-ink-muted"
                  html={visit.location.hoursHtml}
                />
              ) : null}
              {visit.location.notesHtml ? (
                <SafeHtml
                  className="type-card-body text-ink-muted"
                  html={visit.location.notesHtml}
                />
              ) : null}
              <div className="space-y-3 pt-2">
                <p id={mapNoteId} className="sr-only">
                  Selecting Open map loads an interactive map you can pan and zoom.
                </p>
                <div
                  id={mapPanelId}
                  className="relative overflow-hidden rounded-2xl border border-border/70 bg-(--color-canvas) shadow-soft ring-1 ring-border/70 aspect-dynamic"
                  style={{ "--aspect-ratio": visit.location.staticMap.aspectRatio ?? 3 / 2 }}
                  aria-live="polite"
                >
                  {visit.location.mapEmbedSrc ? (
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
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/70 via-(--scrim-strong)/40 to-transparent"
                    aria-hidden
                  />
                </div>
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 type-button text-perazzi-red focus-ring"
                >
                  Open in Maps{" "}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </article>

            <div className="space-y-4">
              {visit.whatToExpectHtml ? (
                <Collapsible open={expectOpen} onOpenChange={setExpectOpen}>
                  <CollapsibleTrigger
                    className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left type-card-title text-ink shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80"
                    aria-expanded={expectOpen}
                    aria-controls="visit-expect-content"
                  >
                    What to expect{" "}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-lg transition-transform",
                        expectOpen ? "rotate-45" : "rotate-0",
                      )}
                    >
                      +
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    id="visit-expect-content"
                    className="mt-3 rounded-2xl border border-border/70 bg-card/60 p-4 type-card-body text-ink-muted shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80"
                  >
                    <SafeHtml
                      className="max-w-none type-card-body text-ink-muted"
                      html={visit.whatToExpectHtml}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
                <Button
                  asChild
                  size="lg"
                  onClick={() => logAnalytics("VisitCtaClick")}
                  className="rounded-full px-6 py-3 type-button"
                >
                <a href={visit.cta.href}>{visit.cta.label}</a>
              </Button>
            </div>
          </div>
        </Section>
      </Container>
    </section>
  );
}
