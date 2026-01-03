"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { FittingStage, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
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
import { cn } from "@/lib/utils";
import { ExpandableTextReveal } from "@/components/motion/ExpandableTextReveal";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { TimelineItem } from "./timeline-item";

type TimelineScrollerProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
};

export function TimelineScroller({ stages, framing }: TimelineScrollerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const analyticsRef = useAnalyticsObserver("CraftTimelineSeen");
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enablePinned = isDesktop && !prefersReducedMotion;
  const enableTitleReveal = enablePinned;
  const animationsEnabled = enablePinned;
  const motionEnabled = !prefersReducedMotion;
  const [activeStage, setActiveStage] = useState(0);
  const resolvedActiveStage = enablePinned ? Math.max(activeStage, 0) : activeStage;
  const seenStagesRef = useRef(new Set<string>());
  const skipTargetId = "home-timeline-anchor";
  const timelineKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  useEffect(() => {
    const currentStage = stages[resolvedActiveStage];
    if (!currentStage) return;
    if (!seenStagesRef.current.has(currentStage.id)) {
      seenStagesRef.current.add(currentStage.id);
      logAnalytics(`CraftTimeline.StageSeen:${currentStage.id}`);
    }
  }, [resolvedActiveStage, stages]);

  return (
    <>
      <div
        id={skipTargetId}
        tabIndex={-1}
        className="sr-only"
      />
      <section
        id="craft-timeline"
        ref={(node) => {
          sectionRef.current = node;
          analyticsRef.current = node;
        }}
        data-analytics-id="CraftTimelineSeen"
        className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
        aria-labelledby="craft-timeline-heading"
      >
        <TimelineRevealSection
          key={timelineKey}
          stages={stages}
          framing={framing}
          isDesktop={isDesktop}
          enableTitleReveal={enableTitleReveal}
          enablePinned={enablePinned}
          animationsEnabled={animationsEnabled}
          motionEnabled={motionEnabled}
          scrollRef={sectionRef}
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          resolvedActiveStage={resolvedActiveStage}
        />
      </section>
    </>
  );
}

type TimelineRevealSectionProps = {
  readonly stages: readonly FittingStage[];
  readonly framing: HomeData["timelineFraming"];
  readonly isDesktop: boolean;
  readonly enableTitleReveal: boolean;
  readonly enablePinned: boolean;
  readonly animationsEnabled: boolean;
  readonly motionEnabled: boolean;
  readonly scrollRef: RefObject<HTMLElement | null>;
  readonly activeStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly resolvedActiveStage: number;
};

function TimelineRevealSection({
  stages,
  framing,
  isDesktop,
  enableTitleReveal,
  enablePinned,
  animationsEnabled,
  motionEnabled,
  scrollRef,
  activeStage,
  setActiveStage,
  resolvedActiveStage,
}: TimelineRevealSectionProps) {
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({
    defaultExpanded: false,
    containerRef: scrollRef,
    scrollOnExpand: true,
  });

  const headingTitle = framing.title ?? "Craftsmanship Journey";
  const headingEyebrow = framing.eyebrow ?? "Three rituals that define a bespoke Perazzi build";
  const headingInstructions = framing.instructions
    ?? "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.";
  const alternateTitle = framing.alternateTitle ?? "Fitting Timeline";
  const backgroundUrl = framing.background?.url
    ?? "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
  const backgroundAlt = framing.background?.alt ?? "Perazzi workshop background";

  const revealTimeline = phase === "expanded" || phase === "closingHold";
  const isCollapsedPhase = phase === "collapsed" || phase === "prezoom";
  const revealPhotoFocus = revealTimeline;
  const parallaxStrength = 0.16;
  const parallaxEnabled = enableTitleReveal && !revealTimeline && motionEnabled;
  const timelineLayoutTransition = motionEnabled
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
    scrimMode: "dualFocusFade",
    backgroundScale: { collapsed: 1.32, prezoom: 1.12, expanded: 1 },
    itemOffsetY: 12,
    blurPx: 6,
    glassScale: 0.985,
  });
  const surfaceVariants = createExpandableSectionVariants({
    motionMode: motionEnabled ? "full" : "reduced",
    scrimMode: "dualFocusFade",
    itemOffsetY: 12,
    blurPx: 0,
    glassScale: 0.985,
  });
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
  const pinnedToneVariants = buildGlassToneVariants({
    backgroundStrength: 70,
    borderStrength: 70,
    blurPx: 4,
    shadow: "elevated",
  });
  const pinnedSurfaceVariants = mergeVariants(surfaceItem, pinnedToneVariants);
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

  const handleTimelineExpand = () => {
    if (!enableTitleReveal) return;
    open();
  };
  const handleTimelineCollapse = () => {
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
              src={backgroundUrl}
              alt={backgroundAlt}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimTop}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0 pointer-events-none" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        </motion.div>
        <motion.div className="absolute inset-0 pointer-events-none" variants={slotVariants.scrimBottom}>
          <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas" aria-hidden />
        </motion.div>
      </motion.div>

      <motion.div
        id="craft-timeline-content"
        tabIndex={-1}
        className="focus:outline-none focus-ring"
        variants={slotVariants.section}
        initial={motionEnabled ? "collapsed" : false}
        animate={phase}
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            style={glassStyle}
            className="relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
            variants={glassVariants}
            onKeyDown={onEscapeKeyDown}
            layout
            transition={containerLayoutTransition}
          >
            <LayoutGroup id="craft-timeline-title">
              {showExpanded ? (
                <motion.div
                  key="craft-timeline-header"
                  className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div className="space-y-3" variants={headerGroup}>
                    <motion.div
                      layoutId="craft-timeline-title"
                      layoutCrossfade={false}
                      transition={timelineLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={headingItem}>
                        <Heading
                          id="craft-timeline-heading"
                          level={2}
                          size="xl"
                        >
                          <ExpandableTextReveal text={headingTitle} reduceMotion={!motionEnabled} />
                        </Heading>
                      </motion.div>
                    </motion.div>
                    <motion.div
                      layoutId="craft-timeline-subtitle"
                      layoutCrossfade={false}
                      transition={timelineLayoutTransition}
                      className="relative"
                    >
                      <motion.div variants={subheadingItem}>
                        <Text size="lg" className="type-section-subtitle">
                          <ExpandableTextReveal text={headingEyebrow} reduceMotion={!motionEnabled} />
                        </Text>
                      </motion.div>
                    </motion.div>
                    <span className="sr-only">{headingInstructions}</span>
                  </motion.div>
                  <motion.div variants={surfaceItem}>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleTimelineCollapse}
                    >
                      Collapse
                    </button>
                  </motion.div>
                </motion.div>
              ) : null}
              {showCollapsed ? (
                <motion.div
                  key="craft-timeline-title-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  <motion.div className="flex flex-col items-center gap-3" variants={headerGroup}>
                    <motion.div
                      layoutId="craft-timeline-title"
                      layoutCrossfade={false}
                      transition={timelineLayoutTransition}
                      className="relative inline-flex text-white"
                    >
                      <motion.div variants={collapsedHeaderItem}>
                        <Heading
                          id="craft-timeline-heading"
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
                        onFocus={handleTimelineExpand}
                        onClick={handleTimelineExpand}
                        onKeyDown={onTriggerKeyDown}
                        aria-expanded={expanded}
                        aria-controls="craft-timeline-body"
                        aria-labelledby="craft-timeline-heading"
                      >
                        <span className="sr-only">Expand {headingTitle}</span>
                      </button>
                    </motion.div>
                    <motion.div
                      layoutId="craft-timeline-subtitle"
                      layoutCrossfade={false}
                      transition={timelineLayoutTransition}
                      className="relative text-white"
                    >
                      <motion.div variants={collapsedHeaderItem}>
                        <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                          {headingEyebrow}
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
                        <button type="button" onClick={handleTimelineExpand} onKeyDown={onTriggerKeyDown}>
                          Read more
                        </button>
                      </Text>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : null}
            </LayoutGroup>

            <motion.div
              variants={slotVariants.section}
              initial={motionEnabled ? "collapsed" : false}
              animate={phase}
            >
              {showExpanded ? (
                <motion.div
                  key="craft-timeline-body"
                  id="craft-timeline-body"
                  className="space-y-6"
                  variants={slotVariants.section}
                  initial={motionEnabled ? "collapsed" : false}
                  animate={phase}
                >
                  {enablePinned ? (
                    <motion.div
                      className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start"
                      variants={bodyGroup}
                    >
                      <motion.div
                        className="space-y-4 border-none bg-card/0 p-4 shadow-none sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none"
                        variants={bodyItem}
                      >
                        <motion.div className="space-y-4" variants={itemsGroup}>
                          <motion.div variants={surfaceItem}>
                            <Text size="label-tight" className="mb-3 text-ink">
                              {alternateTitle}
                            </Text>
                          </motion.div>
                          <LayoutGroup id="home-timeline-controls">
                            <motion.div className="space-y-1" variants={itemsGroup}>
                              {stages.map((stage, index) => (
                                <motion.div key={`control-${stage.id}`} variants={surfaceItem}>
                                  <TimelineControlButton
                                    label={stage.title}
                                    order={stage.order}
                                    active={resolvedActiveStage === index}
                                    onSelect={() => { setActiveStage(index); }}
                                    animationsEnabled={animationsEnabled}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          </LayoutGroup>
                        </motion.div>
                      </motion.div>

                      <motion.div className="space-y-5" variants={bodyItem}>
                        <motion.div
                          className="relative min-h-[640px] overflow-hidden rounded-3xl border"
                          variants={pinnedSurfaceVariants}
                        >
                          <AnimatePresence initial={false} mode="wait">
                            {stages[resolvedActiveStage] ? (
                              <PinnedStagePanel
                                key={`panel-${stages[resolvedActiveStage].id}`}
                                stage={stages[resolvedActiveStage]}
                                animationsEnabled={animationsEnabled}
                                revealPhotoFocus={revealPhotoFocus}
                              />
                            ) : null}
                          </AnimatePresence>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div className="space-y-8" variants={bodyGroup}>
                      <motion.div className="space-y-3" variants={bodyItem}>
                        <Text size="label-tight" className="text-ink-muted">
                          {alternateTitle}
                        </Text>
                      </motion.div>

                      <motion.div className="space-y-3" variants={itemsGroup}>
                        {stages.map((stage, index) => {
                          const expanded = activeStage === index;
                          const panelId = `craft-stage-panel-${stage.id}`;
                          const buttonId = `craft-stage-trigger-${stage.id}`;

                          return (
                            <motion.div
                              key={`stacked-${stage.id}`}
                              className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:p-4"
                              variants={surfaceItem}
                              layout="size"
                            >
                              <button
                                type="button"
                                id={buttonId}
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                onClick={() =>
                                  { setActiveStage(expanded ? -1 : index); }
                                }
                                className="flex w-full items-center justify-between gap-3 text-left focus-ring"
                              >
                                <div>
                                  <Text size="button" className="text-ink-muted mb-2">
                                    Stage {stage.order}
                                  </Text>
                                  <Text className="text-lg type-body-title text-ink">
                                    {stage.title}
                                  </Text>
                                </div>
                                <span className="type-button text-perazzi-red/70">
                                  {expanded ? "Collapse" : "Show more"}
                                </span>
                              </button>

                              <AnimatePresence initial={false}>
                                {expanded ? (
                                  <motion.div
                                    key={`panel-${stage.id}`}
                                    id={panelId}
                                    aria-labelledby={buttonId}
                                    className="mt-3 overflow-hidden"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={homeMotion.revealFast}
                                    layout
                                  >
                                    <div className="mt-2">
                                      <TimelineItem stage={stage} />
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  )}
                  <motion.div className="pt-2 sm:pt-4" variants={ctaItem}>
                    <Button
                      asChild
                      variant="secondary"
                      size="lg"
                      className="w-full type-button-eaves text-ink"
                    >
                      <Link href="/the-build/why-a-perazzi-has-a-soul">
                        See the full build story
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

type ControlButtonProps = {
  readonly label: string;
  readonly order: number;
  readonly active: boolean;
  readonly onSelect: () => void;
  readonly animationsEnabled: boolean;
};

function TimelineControlButton({
  label,
  order,
  active,
  onSelect,
  animationsEnabled,
}: ControlButtonProps) {
  const baseClass = cn(
    "group relative w-full overflow-hidden rounded-2xl px-3 py-2 text-left transition-colors focus-ring",
    active
      ? "text-white"
      : "bg-transparent text-ink-muted hover:bg-ink/10 hover:text-ink",
  );

  return (
    <motion.button
      type="button"
      className={baseClass}
      onClick={onSelect}
      initial={false}
      whileHover={animationsEnabled ? { scale: active ? 1.012 : 1.006 } : undefined}
      whileTap={animationsEnabled ? { scale: 0.994 } : undefined}
      aria-pressed={active}
    >
      {active ? (
        animationsEnabled ? (
          <motion.span
            layoutId="timeline-control-highlight"
            className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
            transition={homeMotion.springHighlight}
            aria-hidden="true"
          />
        ) : (
          <span
            className="absolute inset-0 rounded-2xl bg-perazzi-red shadow-elevated ring-1 ring-white/10"
            aria-hidden="true"
          />
        )
      ) : null}
      <span
        className={cn(
          "relative z-10 block type-button group-hover:text-ink-muted/90",
          active ? "text-white/90" : "text-perazzi-red/80",
        )}
      >
        Stage {order}
      </span>
      <span
        className={cn(
          "relative z-10 mt-0.5 block type-card-title text-xl",
          active ? "text-white" : "text-ink",
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}

type PinnedStageProps = {
  readonly stage: FittingStage;
  readonly animationsEnabled: boolean;
  readonly revealPhotoFocus: boolean;
};

function PinnedStagePanel({
  stage,
  animationsEnabled,
  revealPhotoFocus,
}: PinnedStageProps) {
  const sizes = "(min-width: 1600px) 860px, (min-width: 1280px) 760px, 100vw";
  const Wrapper = animationsEnabled ? motion.div : "div";
  const motionEnabled = animationsEnabled;

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: motionEnabled ? 0.08 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const media = (
    <motion.div
      className="flex h-full w-full flex-col gap-4 p-4 sm:p-6"
      variants={content}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="group relative aspect-3/2 sm:aspect-4/3 w-full overflow-hidden rounded-2xl bg-(--color-canvas)"
        initial={motionEnabled ? { opacity: 0, y: 6, scale: 0.985 } : undefined}
        animate={motionEnabled ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={motionEnabled ? homeMotion.reveal : undefined}
      >
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-1400 ease-out will-change-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
          priority={stage.order === 1}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      </motion.div>

      <motion.div className="space-y-3" variants={item}>
        <Text size="button" className="text-ink-muted">
          Stage {stage.order}
        </Text>
        <Heading level={3} size="lg" className="type-body-title text-ink not-italic">
          {stage.title}
        </Heading>
        <Text className="type-body text-ink-muted">
          {stage.body}
        </Text>
        {stage.media.caption ? (
          <Text size="caption" className="text-ink-muted">
            {stage.media.caption}
          </Text>
        ) : null}
      </motion.div>
    </motion.div>
  );

  if (!animationsEnabled) {
    return <div className="absolute inset-0">{media}</div>;
  }

  return (
    <Wrapper
      className="absolute inset-0"
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
      transition={homeMotion.revealFast}
    >
      {media}
    </Wrapper>
  );
}
