"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { VisitFactoryData } from "@/types/experience";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";
import SafeHtml from "@/components/SafeHtml";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Container,
  Heading,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

type VisitFactoryProps = {
  readonly visitFactorySection: VisitFactoryData;
};

type VisitFactoryRevealSectionProps = {
  readonly visit: VisitFactoryData;
  readonly heading: string;
  readonly subheading: string;
  readonly background: { url: string; alt?: string };
  readonly enableTitleReveal: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
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
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const visitKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const visit = visitFactorySection;
  const background = {
    url: visit.backgroundImage?.url
      ?? "/redesign-photos/experience/pweb-experience-visitfactory-bg.jpg",
    alt: visit.backgroundImage?.alt ?? "Perazzi Botticino factory background",
  };
  const heading = visit.heading ?? "Visit Botticino";
  const subheading = visit.subheading ?? "See the factory in person";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="VisitFactorySeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        isCollapsed
          ? "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:content-['']"
          : null,
      )}
      aria-labelledby="visit-factory-heading"
    >
      <VisitFactoryRevealSection
        key={visitKey}
        visit={visit}
        heading={heading}
        subheading={subheading}
        background={background}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
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
  onCollapsedChange,
}: VisitFactoryRevealSectionProps) => {
  const [visitExpanded, setVisitExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expectOpen, setExpectOpen] = useState(false);

  const mapPanelId = "visit-map-panel";
  const mapNoteId = "visit-map-note";
  const mapHref =
    visit.location.mapLinkHref ??
    `https://maps.google.com/?q=${encodeURIComponent(visit.location.name)}`;

  const revealVisit = !enableTitleReveal || visitExpanded;
  const revealPhotoFocus = revealVisit;
  const visitMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: visitShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealVisit,
    deps: [expectOpen],
  });

  const handleVisitExpand = () => {
    if (!enableTitleReveal) return;
    beginExpand(() => {
      setVisitExpanded(true);
      setHeaderThemeReady(true);
      onCollapsedChange?.(false);
    });
  };

  const handleVisitCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setVisitExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <>
      <RevealExpandedHeader
        headingId="visit-factory-heading"
        heading={heading}
        subheading={subheading}
        headerThemeReady={headerThemeReady}
        enableTitleReveal={enableTitleReveal}
        onCollapse={handleVisitCollapse}
      >
        {visit.introHtml ? (
          <div>
            <SafeHtml
              className="prose-journal max-w-none text-ink-muted md:max-w-4xl lg:max-w-4xl"
              html={visit.introHtml}
            />
          </div>
        ) : null}
      </RevealExpandedHeader>
      <VisitFactoryBody
        revealVisit
        visit={visit}
        mapHref={mapHref}
        mapPanelId={mapPanelId}
        mapNoteId={mapNoteId}
        expectOpen={expectOpen}
        onExpectOpenChange={setExpectOpen}
      />
    </>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt ?? "Perazzi Botticino factory background" }}
        reveal={revealVisit}
        revealOverlay={revealPhotoFocus}
        enableParallax={enableTitleReveal && !revealVisit}
        overlay="canvas"
        loading="lazy"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={visitShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={visitMinHeight ?? undefined}
        >
          {revealVisit ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="visit-factory-heading"
                heading={heading}
                subheading={subheading}
                controlsId="visit-factory-body"
                expanded={revealVisit}
                onExpand={handleVisitExpand}
              />
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </Container>
    </>
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
