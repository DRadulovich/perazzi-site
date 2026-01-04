"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import SafeHtml from "@/components/SafeHtml";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Container, Heading, Text } from "@/components/ui";

type VisitFactoryProps = {
  readonly visitFactorySection: VisitFactoryData;
};

type VisitFactoryRevealSectionProps = {
  readonly visit: VisitFactoryData;
  readonly heading: string;
  readonly subheading: string;
  readonly background: { url: string; alt?: string };
  readonly enableTitleReveal: boolean;
};

type VisitFactoryBackdropProps = {
  readonly background: { url: string; alt?: string };
  readonly revealVisit: boolean;
  readonly revealPhotoFocus: boolean;
};

type VisitFactoryHeaderProps = {
  readonly revealVisit: boolean;
  readonly headerThemeReady: boolean;
  readonly heading: string;
  readonly subheading: string;
  readonly introHtml: string;
  readonly enableTitleReveal: boolean;
  readonly onCollapse: () => void;
  readonly onExpand: () => void;
};

type VisitFactoryBodyProps = {
  readonly revealVisit: boolean;
  readonly visit: VisitFactoryData;
  readonly mapHref: string;
  readonly mapPanelId: string;
  readonly mapNoteId: string;
  readonly expectOpen: boolean;
  readonly onExpectOpenChange: (open: boolean) => void;
};

export function VisitFactory({ visitFactorySection }: VisitFactoryProps) {
  const analyticsRef = useAnalyticsObserver("VisitFactorySeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const visitKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const visit = visitFactorySection;
  const background = {
    url: visit.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-visitfactory-bg.jpg",
    alt: visit.backgroundImage?.alt ?? "Perazzi Botticino factory background",
  };
  const heading = visit.heading ?? "Visit Botticino";
  const subheading = visit.subheading ?? "See the factory in person";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="VisitFactorySeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="visit-factory-heading"
    >
      <VisitFactoryRevealSection
        key={visitKey}
        visit={visit}
        heading={heading}
        subheading={subheading}
        background={background}
        enableTitleReveal={enableTitleReveal}
      />
    </section>
  );
}

const VisitFactoryRevealSection = ({
  visit,
  heading,
  subheading,
  background,
  enableTitleReveal,
}: VisitFactoryRevealSectionProps) => {
  const [visitExpanded, setVisitExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [expectOpen, setExpectOpen] = useState(false);
  const visitShellRef = useRef<HTMLDivElement | null>(null);

  const mapPanelId = "visit-map-panel";
  const mapNoteId = "visit-map-note";
  const mapHref =
    visit.location.mapLinkHref ??
    `https://maps.google.com/?q=${encodeURIComponent(visit.location.name)}`;

  const revealVisit = !enableTitleReveal || visitExpanded;
  const revealPhotoFocus = revealVisit;
  const visitMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const minHeightStyle =
    enableTitleReveal && revealVisit && expandedHeight ? { minHeight: expandedHeight } : undefined;

  const handleVisitExpand = () => {
    if (!enableTitleReveal) return;
    setVisitExpanded(true);
    setHeaderThemeReady(true);
  };

  const handleVisitCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setVisitExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealVisit) return;
    const node = visitShellRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enableTitleReveal, revealVisit, expectOpen]);

  return (
    <>
      <VisitFactoryBackdrop
        background={background}
        revealVisit={revealVisit}
        revealPhotoFocus={revealPhotoFocus}
      />

      <Container size="xl" className="relative z-10">
        <div
          ref={visitShellRef}
          style={minHeightStyle}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            visitMinHeight,
          )}
        >
          <VisitFactoryHeader
            revealVisit={revealVisit}
            headerThemeReady={headerThemeReady}
            heading={heading}
            subheading={subheading}
            introHtml={visit.introHtml}
            enableTitleReveal={enableTitleReveal}
            onCollapse={handleVisitCollapse}
            onExpand={handleVisitExpand}
          />
          <VisitFactoryBody
            revealVisit={revealVisit}
            visit={visit}
            mapHref={mapHref}
            mapPanelId={mapPanelId}
            mapNoteId={mapNoteId}
            expectOpen={expectOpen}
            onExpectOpenChange={setExpectOpen}
          />
        </div>
      </Container>
    </>
  );
};

const VisitFactoryBackdrop = ({
  background,
  revealVisit,
  revealPhotoFocus,
}: VisitFactoryBackdropProps) => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0">
      <Image
        src={background.url}
        alt={background.alt ?? "Perazzi Botticino factory background"}
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
        loading="lazy"
      />
    </div>
    <div
      className={cn(
        "absolute inset-0 bg-(--scrim-strong)",
        revealVisit ? "opacity-0" : "opacity-100",
      )}
      aria-hidden
    />
    <div
      className={cn(
        "absolute inset-0 bg-(--scrim-strong)",
        revealPhotoFocus ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    />
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overlay-gradient-canvas",
        revealPhotoFocus ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    />
  </div>
);

const VisitFactoryHeader = ({
  revealVisit,
  headerThemeReady,
  heading,
  subheading,
  introHtml,
  enableTitleReveal,
  onCollapse,
  onExpand,
}: VisitFactoryHeaderProps) => {
  if (revealVisit) {
    return (
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="space-y-3">
          <div className="relative">
            <Heading
              id="visit-factory-heading"
              level={2}
              size="xl"
              className={headerThemeReady ? "text-ink" : "text-white"}
            >
              {heading}
            </Heading>
          </div>
          <div className="relative">
            <Text
              size="lg"
              className={cn(
                "type-section-subtitle",
                headerThemeReady ? "text-ink-muted" : "text-white",
              )}
            >
              {subheading}
            </Text>
          </div>
          {introHtml ? (
            <div>
              <SafeHtml
                className="prose-journal max-w-none text-ink-muted md:max-w-4xl lg:max-w-4xl"
                html={introHtml}
              />
            </div>
          ) : null}
        </div>
        {enableTitleReveal ? (
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            Collapse
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative inline-flex text-white">
        <Heading id="visit-factory-heading" level={2} size="xl" className="type-section-collapsed">
          {heading}
        </Heading>
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer focus-ring"
          onPointerEnter={onExpand}
          onFocus={onExpand}
          onClick={onExpand}
          aria-expanded={revealVisit}
          aria-controls="visit-factory-body"
          aria-labelledby="visit-factory-heading"
        >
          <span className="sr-only">Expand {heading}</span>
        </button>
      </div>
      <div className="relative text-white">
        <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
          {subheading}
        </Text>
      </div>
      <div className="mt-3">
        <Text size="button" className="text-white/80 cursor-pointer focus-ring" asChild>
          <button type="button" onClick={onExpand}>
            Read more
          </button>
        </Text>
      </div>
    </div>
  );
};

const VisitFactoryBody = ({
  revealVisit,
  visit,
  mapHref,
  mapPanelId,
  mapNoteId,
  expectOpen,
  onExpectOpenChange,
}: VisitFactoryBodyProps) => {
  if (!revealVisit) return null;

  return (
    <div id="visit-factory-body" className="space-y-6">
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
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-(--color-canvas) shadow-soft ring-1 ring-border/70 aspect-dynamic"
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
              Open in Maps <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </article>

        <div className="space-y-4">
          {visit.whatToExpectHtml ? (
            <Collapsible open={expectOpen} onOpenChange={onExpectOpenChange}>
              <CollapsibleTrigger
                className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left type-card-title text-ink shadow-soft backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80"
                aria-expanded={expectOpen}
                aria-controls="visit-expect-content"
              >
                What to expect{" "}
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-lg",
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
    </div>
  );
};
