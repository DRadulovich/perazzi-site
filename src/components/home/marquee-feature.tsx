"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll } from "framer-motion";
import Image from "next/image";
import type { RefObject } from "react";
import type { Champion, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { homeMotion } from "@/lib/motionConfig";
import {
  CONTAINER_EXPAND_MS,
  COLLAPSE_TIME_SCALE,
  EASE_CINEMATIC,
  EXPAND_TIME_SCALE,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import {
  buildGlassToneVariants,
  buildTitleToneVariants,
  mergeVariants,
} from "@/motion/expandableSectionTone";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
import { useParallaxMotion } from "@/motion/useParallaxMotion";
import { ExpandableTextReveal } from "@/components/motion/ExpandableTextReveal";
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
        isDesktop={isDesktop}
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
  isDesktop: boolean;
  enableTitleReveal: boolean;
  motionEnabled: boolean;
  scrollRef: RefObject<HTMLElement | null>;
}>;

function MarqueeFeatureRevealSection({
  champion,
  ui,
  isDesktop,
  enableTitleReveal,
  motionEnabled,
  scrollRef,
}: MarqueeFeatureRevealSectionProps) {
  const { expanded, phase, open, close, onTriggerKeyDown, onEscapeKeyDown } =
    useExpandableSectionTimeline({
      defaultExpanded: false,
      containerRef: scrollRef,
      scrollOnExpand: true,
      closeOnOutsideClick: true,
    });

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

  const revealMarquee = phase === "expanded" || phase === "closingHold";
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const parallaxStrength = 0.16;
  const parallaxEnabled = enableTitleReveal && !revealMarquee && motionEnabled;
  const marqueeLayoutTransition = motionEnabled
    ? {
      layout: {
        duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
        ease: EASE_CINEMATIC,
      },
    }
    : undefined;
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useParallaxMotion(scrollYProgress, {
    enabled: parallaxEnabled,
    strength: parallaxStrength,
    targetRef: scrollRef,
  });
  const parallaxStyle = motionEnabled ? { y: parallaxY } : undefined;
  const toSeconds = (ms: number) => ms / 1000;
  const staggerTransition = (staggerMs: number, direction?: 1 | -1) => ({
    transition: {
      staggerChildren: motionEnabled ? toSeconds(staggerMs) : 0,
      staggerDirection: direction,
    },
  });
  const headerGroup = {
    collapsed: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    expanded: staggerTransition(STAGGER_HEADER_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_HEADER_ITEMS_MS, -1),
  } as const;
  const bodyGroup = {
    collapsed: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_BODY_ITEMS_MS),
    expanded: staggerTransition(STAGGER_BODY_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_BODY_ITEMS_MS, -1),
  } as const;
  const itemsGroup = {
    collapsed: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
    prezoom: staggerTransition(STAGGER_LIST_ITEMS_MS),
    expanded: staggerTransition(STAGGER_LIST_ITEMS_MS),
    closingHold: staggerTransition(STAGGER_LIST_ITEMS_MS, -1),
  } as const;
  const slotVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    backgroundScale: { collapsed: 1.32, prezoom: 1.12, expanded: 1 },
    itemOffsetY: 12,
    blurPx: 6,
    glassScale: 0.985,
  });
  const surfaceVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    itemOffsetY: 12,
    blurPx: 0,
    glassScale: 0.985,
  });
  const scrimInverted = {
    collapsed: slotVariants.scrimTop.expanded,
    prezoom: slotVariants.scrimTop.expanded,
    expanded: slotVariants.scrimTop.collapsed,
    closingHold: slotVariants.scrimTop.collapsed,
  } as const;
  const headerItem = slotVariants.expandedHeader;
  const headingToneVariants = buildTitleToneVariants("--color-ink");
  const subheadingToneVariants = buildTitleToneVariants("--color-ink-muted");
  const headingItem = mergeVariants(slotVariants.expandedHeader, headingToneVariants);
  const subheadingItem = mergeVariants(slotVariants.expandedHeader, subheadingToneVariants);
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const ctaItem = slotVariants.ctaRow;
  const surfaceItem = surfaceVariants.content;
  const glassSurfaceStrength = isDesktop ? 25 : 40;
  const glassToneVariants = buildGlassToneVariants({
    backgroundStrength: glassSurfaceStrength,
    borderStrength: 70,
    blurPx: 12,
    shadow: isDesktop ? "elevated" : "soft",
  });
  const glassVariants = mergeVariants(slotVariants.glass, glassToneVariants);
  const containerLayoutTransition = {
    layout: {
      duration: motionEnabled
        ? (CONTAINER_EXPAND_MS / 1000) * (isCollapsedPhase ? COLLAPSE_TIME_SCALE : EXPAND_TIME_SCALE)
        : 0,
      ease: EASE_CINEMATIC,
    },
  };
  const glassStyle = {
    minHeight: "40vh",
    overflow: isCollapsedPhase ? "hidden" : "visible",
  };

  const handleMarqueeExpand = () => {
    if (!enableTitleReveal) return;
    open();
  };

  const handleMarqueeCollapse = () => {
    if (!enableTitleReveal) return;
    close();
  };

  return (
    <motion.div
      variants={slotVariants.section}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
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
        <motion.div className="absolute inset-0" variants={scrimInverted}>
          <div
            className="absolute inset-0 bg-(--scrim-strong)"
            aria-hidden
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="absolute inset-0 bg-(--scrim-strong)"
            aria-hidden
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="pointer-events-none absolute inset-0 film-grain"
            aria-hidden="true"
          />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="pointer-events-none absolute inset-0 overlay-gradient-canvas"
            aria-hidden
          />
        </motion.div>
      </motion.div>

      <motion.div>
        <Container size="xl" className="relative z-10">
          <motion.div
            className="relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
            variants={glassVariants}
            style={glassStyle}
            layout
            transition={containerLayoutTransition}
          >
            <LayoutGroup id="marquee-feature-title">
              <AnimatePresence initial={false}>
                {revealMarquee ? (
                  <motion.div
                    key="marquee-feature-body"
                    id="marquee-feature-body"
                    className="relative z-10"
                    variants={slotVariants.section}
                    initial={motionEnabled ? "collapsed" : false}
                    animate={phase}
                    onKeyDown={onEscapeKeyDown}
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
                            className="object-cover transition-transform duration-1400 ease-out will-change-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                        </motion.div>
                      </motion.div>

                      <div className="mt-8 md:mt-0 md:flex md:items-start md:justify-between md:gap-8">
                        <motion.div className="space-y-4">
                          <motion.div variants={headerGroup} className="space-y-4">
                            <motion.div variants={headerItem}>
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
                              <motion.div variants={headingItem}>
                                <Heading
                                  id="champion-heading"
                                  level={2}
                                  size="xl"
                                >
                                  <ExpandableTextReveal text={headingTitle} reduceMotion={!motionEnabled} />
                                </Heading>
                              </motion.div>
                            </motion.div>
                            <motion.div
                              layoutId="marquee-feature-subtitle"
                              layoutCrossfade={false}
                              transition={marqueeLayoutTransition}
                              className="relative"
                            >
                              <motion.div variants={subheadingItem}>
                                <Text size="lg" className="type-section-subtitle">
                                  <ExpandableTextReveal text={headingSubtitle} reduceMotion={!motionEnabled} />
                                </Text>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                          <motion.div variants={bodyGroup} className="space-y-4">
                            <motion.div variants={bodyItem}>
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
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="marquee-feature-collapsed"
                    className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                    variants={slotVariants.section}
                    initial={motionEnabled ? "collapsed" : false}
                    animate={phase}
                  >
                    <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                      <motion.div
                        layoutId="marquee-feature-title"
                        layoutCrossfade={false}
                        transition={marqueeLayoutTransition}
                        className="relative inline-flex text-white"
                      >
                        <motion.div variants={collapsedHeaderItem}>
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
                          onFocus={handleMarqueeExpand}
                          onClick={handleMarqueeExpand}
                          onKeyDown={onTriggerKeyDown}
                          aria-expanded={expanded}
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
                        <motion.div variants={collapsedHeaderItem}>
                          <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                            {headingSubtitle}
                          </Text>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    <motion.div variants={itemsGroup} className="mt-3">
                      <motion.div variants={ctaItem}>
                        <Text
                          size="button"
                          className="text-white/80 cursor-pointer focus-ring"
                          asChild
                        >
                          <button type="button" onClick={handleMarqueeExpand} onKeyDown={onTriggerKeyDown}>
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
