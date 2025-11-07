"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import Image from "next/image";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";

type VisitFactoryProps = {
  visit: VisitFactoryData;
};

export function VisitFactory({ visit }: VisitFactoryProps) {
  const analyticsRef = useAnalyticsObserver("VisitFactorySeen");
  const [mapOpen, setMapOpen] = useState(false);
  const [expectOpen, setExpectOpen] = useState(false);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="VisitFactorySeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="visit-factory-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Visit Botticino
        </p>
        <h2
          id="visit-factory-heading"
          className="text-2xl font-semibold text-ink"
        >
          See the factory in person
        </h2>
        <div
          className="prose prose-sm max-w-3xl text-ink-muted"
          dangerouslySetInnerHTML={{ __html: visit.introHtml }}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-5">
          <h3 className="text-lg font-semibold text-ink">{visit.location.name}</h3>
          <div
            className="text-sm text-ink-muted"
            dangerouslySetInnerHTML={{ __html: visit.location.addressHtml }}
          />
          {visit.location.hoursHtml ? (
            <div
              className="text-xs uppercase tracking-[0.3em] text-ink-muted"
              dangerouslySetInnerHTML={{ __html: visit.location.hoursHtml }}
            />
          ) : null}
          {visit.location.notesHtml ? (
            <div
              className="text-xs text-ink-muted"
              dangerouslySetInnerHTML={{ __html: visit.location.notesHtml }}
            />
          ) : null}
          <div className="space-y-3 pt-4">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-neutral-200"
              style={{ aspectRatio: visit.location.staticMap.aspectRatio ?? 4 / 3 }}
            >
              {mapOpen && visit.location.mapEmbedSrc ? (
                <iframe
                  id="visit-map-embed"
                  src={visit.location.mapEmbedSrc}
                  title={`${visit.location.name} map`}
                  className="h-full w-full"
                  loading="lazy"
                />
              ) : (
                <Image
                  src={visit.location.staticMap.url}
                  alt={visit.location.staticMap.alt}
                  fill
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                />
              )}
            </div>
            {!mapOpen && visit.location.mapEmbedSrc ? (
              <Button
                variant="secondary"
                size="sm"
                aria-controls="visit-map-embed"
                onClick={() => {
                  setMapOpen(true);
                  console.log("[analytics] VisitMapOpen");
                }}
              >
                Load interactive map
              </Button>
            ) : null}
            <a
              href="https://maps.google.com/?q=Perazzi+Botticino"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-perazzi-red focus-ring"
            >
              Open in Google Maps
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </article>
        <div className="space-y-4">
          {visit.whatToExpectHtml ? (
            <Collapsible.Root open={expectOpen} onOpenChange={setExpectOpen}>
              <Collapsible.Trigger
                className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-ink focus-ring"
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
                className="mt-3 rounded-2xl border border-border/60 bg-card/60 p-4 text-sm text-ink-muted"
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
            onClick={() => console.log("[analytics] VisitCtaClick")}
          >
            <a href={visit.cta.href}>{visit.cta.label}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
