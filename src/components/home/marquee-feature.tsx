"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ExpandableSection } from "@/motion/expandable/ExpandableSection";
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

  return (
    <ExpandableSection
      key={marqueeKey}
      sectionId="home.marqueeFeature"
      defaultExpanded={!enableTitleReveal}
      rootRef={analyticsRef}
      data-analytics-id="ChampionStorySeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed mt-[15px]"
      aria-labelledby="champion-heading"
    >
      {({
        getTriggerProps,
        getCloseProps,
        layoutProps,
        contentVisible,
        bodyId,
      }) => {
        const headerThemeReady = contentVisible;
        const marqueeMinHeight = contentVisible ? null : "min-h-[calc(640px+12rem)]";
        return (
          <>
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div data-es="bg" className="absolute inset-0">
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
                data-es="scrim-bottom"
                className="absolute inset-0 bg-(--scrim-strong)"
                aria-hidden
              />
              <div
                data-es="scrim-top"
                className="pointer-events-none absolute inset-0 overlay-gradient-canvas"
                aria-hidden
              />
            </div>

            <Container size="xl" className="relative z-10">
              <motion.div
                {...layoutProps}
                className={cn("relative", marqueeMinHeight)}
              >
                <div
                  data-es="glass"
                  className={cn(
                    "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
                    contentVisible
                      ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                      : "border-transparent bg-transparent shadow-none backdrop-blur-none",
                  )}
                >
                  {contentVisible ? (
                    <div className="relative z-10">
                      <div className="md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10">
                        <div data-es="main">
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
                          <div data-es="header-expanded" className="space-y-4">
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
                          </div>
                          <button
                            type="button"
                            data-es="close"
                            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
                            {...getCloseProps()}
                          >
                            Collapse
                          </button>
                        </div>
                      </div>

                      <div data-es="body" id={bodyId} className="mt-6 space-y-4">
                        <Text
                          asChild
                          size="lg"
                          className="border-l-2 border-perazzi-red/50 pl-4 type-quote font-artisan text-ink"
                        >
                          <blockquote>“{champion.quote}”</blockquote>
                        </Text>
                      </div>

                      <div data-es="cta" className="mt-4">
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
                    </div>
                  ) : null}
                </div>

                <div
                  data-es="header-collapsed"
                  className={cn(
                    "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center",
                    contentVisible && "pointer-events-none",
                  )}
                  aria-hidden={contentVisible}
                >
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
                      aria-labelledby="champion-heading"
                      {...getTriggerProps({ kind: "header", withHover: true })}
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
                      <button type="button" {...getTriggerProps({ kind: "cta" })}>
                        Read more
                      </button>
                    </Text>
                  </div>
                </div>
              </motion.div>
            </Container>
          </>
        );
      }}
    </ExpandableSection>
  );
}
