"use client";

import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useHeightLock } from "@/hooks/use-height-lock";
import { getSectionHeadingVariants, homeMotion } from "@/lib/motionConfig";
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
  const sectionInView = useInView(scrollRef, { amount: 0.35 });
  const parallaxEnabled = motionEnabled && revealMarquee && sectionInView;
  const focusSurfaceTransition = "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition = "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition = "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const marqueeReveal = homeMotion.revealSlow;
  const marqueeRevealFast = homeMotion.reveal;
  const marqueeCollapse = homeMotion.collapse;
  const marqueeBodyReveal = marqueeReveal;
  const readMoreReveal = motionEnabled
    ? { ...homeMotion.revealFast, delay: homeMotion.sectionHeader.readMoreDelayAfterHeader }
    : undefined;
  const marqueeLayoutTransition = motionEnabled ? { layout: marqueeReveal } : undefined;
  const marqueeMinHeight = enableTitleReveal ? "min-h-[calc(640px+12rem)]" : null;
  const expandedHeight = useHeightLock(marqueeShellRef, {
    enabled: enableTitleReveal && revealMarquee,
    duration: marqueeReveal.duration,
  });
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

  const { headingContainer, headingItem } = getSectionHeadingVariants({
    motionEnabled,
    transition: marqueeReveal,
  });

  const bodyContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionEnabled ? homeMotion.staggerShort : 0,
        delayChildren: motionEnabled ? homeMotion.sectionHeader.bodyDelay : 0,
      },
    },
  } as const;

  const bodyItem = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: marqueeReveal },
  } as const;

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
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
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealMarquee ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 film-grain",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-20" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 overlay-gradient-canvas",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

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
                  initial={motionEnabled ? { opacity: 0, y: 24 } : false}
                  animate={
                    motionEnabled
                      ? { opacity: 1, y: 0, transition: marqueeBodyReveal }
                      : undefined
                  }
                  exit={
                    motionEnabled
                      ? { opacity: 0, y: -16, transition: marqueeCollapse }
                      : undefined
                  }
                >
                  <div className="md:grid md:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)] md:items-center md:gap-10">
                    <motion.div
                      initial={motionEnabled ? { opacity: 0, x: -18, y: 12, filter: "blur(8px)" } : false}
                      animate={
                        motionEnabled
                          ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)", transition: marqueeReveal }
                          : undefined
                      }
                    >
                      <div
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
                      </div>
                    </motion.div>

                    <div className="mt-8 md:mt-0 md:flex md:items-start md:justify-between md:gap-8">
                      <div className="space-y-4">
                        <motion.div
                          className="space-y-4"
                          variants={headingContainer}
                          initial={motionEnabled ? "hidden" : false}
                          animate={motionEnabled ? "show" : undefined}
                        >
                          <motion.div variants={headingItem}>
                            <Text size="label-tight" className="text-ink-muted">
                              {eyebrow}
                            </Text>
                          </motion.div>
                          <motion.div
                            layoutId="marquee-feature-title"
                            layoutCrossfade={false}
                            transition={marqueeLayoutTransition}
                            className="relative"
                            variants={headingItem}
                          >
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
                          <motion.div
                            layoutId="marquee-feature-subtitle"
                            layoutCrossfade={false}
                            transition={marqueeLayoutTransition}
                            className="relative"
                            variants={headingItem}
                          >
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
                        <motion.div
                          className="space-y-4"
                          variants={bodyContainer}
                          initial={motionEnabled ? "hidden" : false}
                          animate={motionEnabled ? "show" : undefined}
                        >
                          <motion.div variants={bodyItem}>
                            <Text
                              asChild
                              size="lg"
                              className="border-l-2 border-perazzi-red/50 pl-4 type-quote font-artisan text-ink"
                            >
                              <blockquote>“{champion.quote}”</blockquote>
                            </Text>
                          </motion.div>
                          {champion.article ? (
                            <motion.a
                              href={`/journal/${champion.article.slug}`}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                              variants={bodyItem}
                              whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
                              whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
                            >
                              {champion.article.title}
                              <span aria-hidden="true">→</span>
                            </motion.a>
                          ) : null}
                        </motion.div>
                      </div>
                      {enableTitleReveal ? (
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                          onClick={handleMarqueeCollapse}
                        >
                          Collapse
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="marquee-feature-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1 } : undefined}
                  exit={motionEnabled ? { opacity: 0 } : undefined}
                  transition={motionEnabled ? marqueeRevealFast : undefined}
                >
                  <motion.div
                    layoutId="marquee-feature-title"
                    layoutCrossfade={false}
                    transition={marqueeLayoutTransition}
                    className="relative inline-flex text-white"
                  >
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
                  </motion.div>
                  <motion.div
                    layoutId="marquee-feature-subtitle"
                    layoutCrossfade={false}
                    transition={marqueeLayoutTransition}
                    className="relative text-white"
                  >
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {headingSubtitle}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: marqueeRevealFast } : undefined}
                    className="mt-3"
                  >
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
              )}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </Container>
    </>
  );
}
