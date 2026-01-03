"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Container, Heading, Text } from "@/components/ui";

type MarqueeFeatureProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
}>;

export function MarqueeFeature({ champion, ui }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver("ChampionStorySeen");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop;
  const marqueeKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ChampionStorySeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed mt-[15px]"
      aria-labelledby="champion-heading"
    >
      <MarqueeFeatureRevealSection
        key={marqueeKey}
        champion={champion}
        ui={ui}
        enableTitleReveal={enableTitleReveal}
      />
    </section>
  );
}

type MarqueeFeatureRevealSectionProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
  enableTitleReveal: boolean;
}>;

function MarqueeFeatureRevealSection({
  champion,
  ui,
  enableTitleReveal,
}: MarqueeFeatureRevealSectionProps) {
  const [marqueeExpanded, setMarqueeExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const marqueeShellRef = useRef<HTMLDivElement | null>(null);

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
  const marqueeMinHeight = enableTitleReveal ? "min-h-[calc(640px+12rem)]" : null;

  const handleMarqueeExpand = () => {
    if (!enableTitleReveal) return;
    setMarqueeExpanded(true);
    setHeaderThemeReady(true);
  };

  const handleMarqueeCollapse = () => {
    if (!enableTitleReveal) return;
    setHeaderThemeReady(false);
    setMarqueeExpanded(false);
  };

  useEffect(() => {
    if (!enableTitleReveal || !revealMarquee) return;
    const node = marqueeShellRef.current;
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
  }, [enableTitleReveal, revealMarquee]);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={background.url}
            alt={background.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            revealMarquee ? "opacity-0" : "opacity-100",
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

      <Container size="xl" className="relative z-10">
        <div
          ref={marqueeShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            marqueeMinHeight,
          )}
        >
          {revealMarquee ? (
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
          ) : (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative inline-flex text-white">
                <Heading
                  id="champion-heading"
                  level={2}
                  size="xl"
                  className="type-section-collapsed"
                >
                  {headingTitle}
                </Heading>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer focus-ring"
                  onPointerEnter={handleMarqueeExpand}
                  onFocus={handleMarqueeExpand}
                  onClick={handleMarqueeExpand}
                  aria-expanded={revealMarquee}
                  aria-controls="marquee-feature-body"
                  aria-labelledby="champion-heading"
                >
                  <span className="sr-only">Expand {headingTitle}</span>
                </button>
              </div>
              <div className="relative text-white">
                <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                  {headingSubtitle}
                </Text>
              </div>
              <div className="mt-3">
                <Text
                  size="button"
                  className="text-white/80 cursor-pointer focus-ring"
                  asChild
                >
                  <button type="button" onClick={handleMarqueeExpand}>
                    Read more
                  </button>
                </Text>
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
