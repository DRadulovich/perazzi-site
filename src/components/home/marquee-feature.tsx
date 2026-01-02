"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";
import { Container, Heading, Text } from "@/components/ui";

type MarqueeFeatureProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
}>;

export function MarqueeFeature({ champion, ui }: MarqueeFeatureProps) {
  const analyticsRef = useAnalyticsObserver("ChampionStorySeen");
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !prefersReducedMotion;
  const motionEnabled = !prefersReducedMotion;
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
        motionEnabled={motionEnabled}
        scrollRef={analyticsRef}
      />
    </section>
  );
}

type MarqueeFeatureRevealSectionProps = Readonly<{
  champion: Champion;
  ui: HomeData["marqueeUi"];
  enableTitleReveal: boolean;
  motionEnabled: boolean;
  scrollRef: RefObject<HTMLElement | null>;
}>;

function MarqueeFeatureRevealSection({
  champion,
  ui,
  enableTitleReveal,
  motionEnabled,
  scrollRef,
}: MarqueeFeatureRevealSectionProps) {
  const [marqueeExpanded, setMarqueeExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const marqueeShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

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
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealMarquee;
  const focusSurfaceTransition = "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition = "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition = "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const marqueeReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const marqueeRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const marqueeCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const marqueeLayoutTransition = motionEnabled ? { layout: marqueeReveal } : undefined;
  const marqueeMinHeight = enableTitleReveal ? "min-h-[calc(640px+12rem)]" : null;
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", parallaxEnabled ? parallaxStrength : "0%"],
  );
  const parallaxStyle = parallaxEnabled ? { y: parallaxY } : undefined;
  const backgroundScale = parallaxEnabled ? 1.32 : 1;
  const backgroundScaleTransition = revealMarquee ? marqueeReveal : marqueeCollapse;

  const handleMarqueeExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setMarqueeExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handleMarqueeCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setMarqueeExpanded(false);
  };

  const sectionSequence = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.12 : 0,
        delayChildren: motionEnabled ? 0.1 : 0,
      },
    },
  } as const;

  const sequenceSlot = {
    hidden: {},
    show: {},
  } as const;

  const atmosphereGroup = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.12 : 0 } },
  } as const;

  const atmosphereMedia = {
    hidden: { opacity: 0, scale: 1.04 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1.1, ease: homeMotion.cinematicEase },
    },
  } as const;

  const atmosphereOverlay = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.9, ease: homeMotion.cinematicEase },
    },
  } as const;

  const headerGroup = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.12 : 0,
        delayChildren: motionEnabled ? 0.12 : 0,
      },
    },
  } as const;

  const bodyGroup = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.1 : 0,
        delayChildren: motionEnabled ? 0.24 : 0,
      },
    },
  } as const;

  const itemsGroup = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? 0.1 : 0,
        delayChildren: motionEnabled ? 0.36 : 0,
      },
    },
  } as const;

  const textItem = {
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.reveal },
  } as const;

  const surfaceItem = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: homeMotion.reveal },
  } as const;

  const expandedContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: homeMotion.revealFast },
    exit: { opacity: 0, transition: marqueeCollapse },
  } as const;

  const collapsedContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: marqueeRevealFast },
    exit: { opacity: 0, transition: marqueeRevealFast },
  } as const;

  useEffect(() => {
    if (!enableTitleReveal || !revealMarquee) return;
    const node = marqueeShellRef.current;
    if (!node) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => { cancelAnimationFrame(frame); };
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enableTitleReveal, revealMarquee]);

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <motion.div
      variants={sectionSequence}
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
    >
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden"
        variants={atmosphereGroup}
      >
        <motion.div className="absolute inset-0" variants={atmosphereMedia}>
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={parallaxStyle}
            initial={false}
            animate={motionEnabled ? { scale: backgroundScale } : undefined}
            transition={motionEnabled ? backgroundScaleTransition : undefined}
          >
            <Image
              src={background.url}
              alt={background.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereOverlay}>
          <div
            className={cn(
              "absolute inset-0 bg-(--scrim-strong)",
              focusFadeTransition,
              revealMarquee ? "opacity-0" : "opacity-100",
            )}
            aria-hidden
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereOverlay}>
          <div
            className={cn(
              "absolute inset-0 bg-(--scrim-strong)",
              focusFadeTransition,
              revealPhotoFocus ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereOverlay}>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 film-grain",
              focusFadeTransition,
              revealPhotoFocus ? "opacity-20" : "opacity-0",
            )}
            aria-hidden="true"
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={atmosphereOverlay}>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 overlay-gradient-canvas",
              focusFadeTransition,
              revealPhotoFocus ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />
        </motion.div>
      </motion.div>

      <motion.div variants={sequenceSlot}>
        <Container size="xl" className="relative z-10">
          <motion.div
            ref={marqueeShellRef}
            style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
            className={cn(
              "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
              focusSurfaceTransition,
              revealPhotoFocus
                ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                : "border-transparent bg-transparent shadow-none backdrop-blur-none",
              marqueeMinHeight,
            )}
          >
            <LayoutGroup id="marquee-feature-title">
              <AnimatePresence initial={false}>
                {revealMarquee ? (
                  <motion.div
                    key="marquee-feature-body"
                    id="marquee-feature-body"
                    className="relative z-10"
                    variants={expandedContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                    exit={motionEnabled ? "exit" : undefined}
                  >
                    <div className="md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10">
                      <motion.div variants={bodyGroup}>
                        <motion.div
                          variants={surfaceItem}
                          className="group relative min-h-[280px] overflow-hidden rounded-2xl bg-elevated ring-1 ring-border/70 aspect-dynamic sm:min-h-[340px]"
                          style={{ "--aspect-ratio": String(ratio) }}
                        >
                          <Image
                            src={champion.image.url}
                            alt={champion.image.alt}
                            fill
                            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-1400 ease-out will-change-transform group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                        </motion.div>
                      </motion.div>

                      <div className="mt-8 md:mt-0 md:flex md:items-start md:justify-between md:gap-8">
                        <motion.div className="space-y-4">
                          <motion.div variants={headerGroup} className="space-y-4">
                            <motion.div variants={textItem}>
                              <Text size="label-tight" className="text-ink-muted">
                                {eyebrow}
                              </Text>
                            </motion.div>
                            <motion.div
                              layoutId="marquee-feature-title"
                              layoutCrossfade={false}
                              transition={marqueeLayoutTransition}
                              className="relative"
                            >
                              <motion.div variants={textItem}>
                                <Heading
                                  id="champion-heading"
                                  level={2}
                                  size="xl"
                                  className={cn(
                                    titleColorTransition,
                                    headerThemeReady ? "text-ink" : "text-white",
                                  )}
                                >
                                  {headingTitle}
                                </Heading>
                              </motion.div>
                            </motion.div>
                            <motion.div
                              layoutId="marquee-feature-subtitle"
                              layoutCrossfade={false}
                              transition={marqueeLayoutTransition}
                              className="relative"
                            >
                              <motion.div variants={textItem}>
                                <Text
                                  size="lg"
                                  className={cn(
                                    "type-section-subtitle",
                                    titleColorTransition,
                                    headerThemeReady ? "text-ink-muted" : "text-white",
                                  )}
                                >
                                  {headingSubtitle}
                                </Text>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                          <motion.div variants={bodyGroup} className="space-y-4">
                            <motion.div variants={textItem}>
                              <Text
                                asChild
                                size="lg"
                                className="border-l-2 border-perazzi-red/50 pl-4 type-quote font-artisan text-ink"
                              >
                                <blockquote>“{champion.quote}”</blockquote>
                              </Text>
                            </motion.div>
                          </motion.div>
                          {champion.article ? (
                            <motion.div variants={itemsGroup}>
                              <motion.a
                                href={`/journal/${champion.article.slug}`}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                                variants={surfaceItem}
                                whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
                                whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
                              >
                                {champion.article.title}
                                <span aria-hidden="true">→</span>
                              </motion.a>
                            </motion.div>
                          ) : null}
                        </motion.div>
                        {enableTitleReveal ? (
                          <motion.div variants={bodyGroup} className="mt-4 md:mt-0">
                            <motion.button
                              type="button"
                              className="inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring"
                              onClick={handleMarqueeCollapse}
                              variants={surfaceItem}
                            >
                              Collapse
                            </motion.button>
                          </motion.div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="marquee-feature-collapsed"
                    className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                    variants={collapsedContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                    exit={motionEnabled ? "exit" : undefined}
                  >
                    <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                      <motion.div
                        layoutId="marquee-feature-title"
                        layoutCrossfade={false}
                        transition={marqueeLayoutTransition}
                        className="relative inline-flex text-white"
                      >
                        <motion.div variants={textItem}>
                          <Heading
                            id="champion-heading"
                            level={2}
                            size="xl"
                            className="type-section-collapsed"
                          >
                            {headingTitle}
                          </Heading>
                        </motion.div>
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
                      </motion.div>
                      <motion.div
                        layoutId="marquee-feature-subtitle"
                        layoutCrossfade={false}
                        transition={marqueeLayoutTransition}
                        className="relative text-white"
                      >
                        <motion.div variants={textItem}>
                          <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                            {headingSubtitle}
                          </Text>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    <motion.div variants={itemsGroup} className="mt-3">
                      <motion.div variants={textItem}>
                        <Text
                          size="button"
                          className="text-white/80 cursor-pointer focus-ring"
                          asChild
                        >
                          <button type="button" onClick={handleMarqueeExpand}>
                            Read more
                          </button>
                        </Text>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>
          </motion.div>
        </Container>
      </motion.div>
    </motion.div>
  );
}
