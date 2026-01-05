"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  Container,
  Heading,
  RevealCollapsedHeader,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

type MarqueeFeatureProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
}>;

export function MarqueeFeature({ champion, ui }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver("ChampionStorySeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const marqueeKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ChampionStorySeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed mt-[15px]",
        isCollapsed
          ? "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:content-['']"
          : null,
      )}
      aria-labelledby="champion-heading"
    >
      <MarqueeFeatureRevealSection
        key={marqueeKey}
        champion={champion}
        ui={ui}
        enableTitleReveal={enableTitleReveal}
        onCollapsedChange={setIsCollapsed}
      />
    </section>
  );
}

type MarqueeFeatureRevealSectionProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
  enableTitleReveal: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}>;

function MarqueeFeatureRevealSection({
  champion,
  ui,
  enableTitleReveal,
  onCollapsedChange,
}: MarqueeFeatureRevealSectionProps) {
  const [marqueeExpanded, setMarqueeExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);

  const ratio = champion.image.aspectRatio ?? 3 / 4;
  const background = ui.background ?? {
    id: "marquee-background-fallback",
    kind: "image",
    url: "/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg",
    alt: "Perazzi workshop background",
  };
  const eyebrow = ui.eyebrow ?? "Champion spotlight";
  const headingTitle = champion.name;
  const headingSubtitle = champion.title;

  const revealMarquee = !enableTitleReveal || marqueeExpanded;
  const revealPhotoFocus = revealMarquee;
  const marqueeMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: marqueeShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealMarquee,
  });

  const handleMarqueeExpand = () => {
    if (!enableTitleReveal) return;
    beginExpand(() => {
      setMarqueeExpanded(true);
      setHeaderThemeReady(true);
      onCollapsedChange?.(false);
    });
  };

  const handleMarqueeCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setMarqueeExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <div id="marquee-feature-body" className="relative z-10">
      <div className="md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10">
        <div>
          <div
            className="group relative min-h-[280px] overflow-hidden rounded-2xl bg-elevated ring-1 ring-border/70 aspect-dynamic sm:min-h-[340px]"
            style={{ "--aspect-ratio": String(ratio) }}
          >
            <Image
              src={champion.image.url}
              alt={champion.image.alt}
              fill
              sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="mt-8 md:mt-0 md:flex md:items-start md:justify-between md:gap-8">
          <div className="space-y-4">
            <Text size="label-tight" className="text-ink-muted">
              {eyebrow}
            </Text>
            <div className="relative">
              <Heading
                id="champion-heading"
                level={2}
                size="xl"
                className={headerThemeReady ? "text-ink" : "text-white"}
              >
                {headingTitle}
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
                {headingSubtitle}
              </Text>
            </div>
            <Text
              asChild
              size="lg"
              className="border-l-2 border-perazzi-red/50 pl-4 type-quote font-artisan text-ink"
            >
              <blockquote>“{champion.quote}”</blockquote>
            </Text>
            {champion.article ? (
              <a
                href={`/journal/${champion.article.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {champion.article.title}
                <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </div>
          {enableTitleReveal ? (
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
              onClick={handleMarqueeCollapse}
            >
              Collapse
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealMarquee}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealMarquee}
        overlay="canvas"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={marqueeShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={marqueeMinHeight ?? undefined}
        >
          {revealMarquee ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="champion-heading"
                heading={headingTitle}
                subheading={headingSubtitle}
                controlsId="marquee-feature-body"
                expanded={revealMarquee}
                onExpand={handleMarqueeExpand}
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
}
