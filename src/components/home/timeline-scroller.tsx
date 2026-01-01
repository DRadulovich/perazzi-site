"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { FittingStage, HomeData } from "@/types/content";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";
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
          enableTitleReveal={enableTitleReveal}
          enablePinned={enablePinned}
          animationsEnabled={animationsEnabled}
          motionEnabled={motionEnabled}
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
  readonly enableTitleReveal: boolean;
  readonly enablePinned: boolean;
  readonly animationsEnabled: boolean;
  readonly motionEnabled: boolean;
  readonly activeStage: number;
  readonly setActiveStage: Dispatch<SetStateAction<number>>;
  readonly resolvedActiveStage: number;
};

function TimelineRevealSection({
  stages,
  framing,
  enableTitleReveal,
  enablePinned,
  animationsEnabled,
  motionEnabled,
  activeStage,
  setActiveStage,
  resolvedActiveStage,
}: TimelineRevealSectionProps) {
  const [timelineExpanded, setTimelineExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);

  const headingTitle = framing.title ?? "Craftsmanship Journey";
  const headingEyebrow = framing.eyebrow ?? "Three rituals that define a bespoke Perazzi build";
  const headingInstructions = framing.instructions
    ?? "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.";
  const alternateTitle = framing.alternateTitle ?? "Fitting Timeline";
  const backgroundUrl = framing.background?.url
    ?? "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
  const backgroundAlt = framing.background?.alt ?? "Perazzi workshop background";

  const revealTimeline = !enableTitleReveal || timelineExpanded;
  const revealPhotoFocus = revealTimeline;
  const focusSurfaceTransition = "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition = "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition = "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const timelineReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const timelineRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const timelineCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const timelineBodyReveal = timelineReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: timelineReveal.duration }
    : undefined;
  const timelineLayoutTransition = motionEnabled ? { layout: timelineReveal } : undefined;
  const timelineMinHeight = enableTitleReveal ? "min-h-[calc(640px+18rem)]" : null;

  const handleTimelineExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setTimelineExpanded(true);
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };
  const handleTimelineCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    setTimelineExpanded(false);
  };

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: timelineReveal },
  } as const;

  useEffect(() => {
    if (!enableTitleReveal || !revealTimeline) return;
    const node = timelineShellRef.current;
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
  }, [enableTitleReveal, revealTimeline, resolvedActiveStage]);

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={backgroundUrl}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-soft)",
            focusFadeTransition,
            revealTimeline ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-soft)",
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
            "absolute inset-0 overlay-gradient-canvas",
            focusFadeTransition,
            revealPhotoFocus ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <div
        id="craft-timeline-content"
        tabIndex={-1}
        className="focus:outline-none focus-ring"
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            ref={timelineShellRef}
            style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
            className={cn(
              "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
              focusSurfaceTransition,
              revealPhotoFocus
                ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
                : "border-transparent bg-transparent shadow-none backdrop-blur-none",
              timelineMinHeight,
            )}
          >
            <LayoutGroup id="craft-timeline-title">
              <AnimatePresence initial={false}>
                {revealTimeline ? (
                  <motion.div
                    key="craft-timeline-header"
                    className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8"
                    initial={motionEnabled ? { opacity: 0 } : false}
                    animate={motionEnabled ? { opacity: 1, transition: timelineReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, transition: timelineRevealFast } : undefined}
                  >
                    <motion.div
                      className="space-y-3"
                      variants={headingContainer}
                      initial="hidden"
                      animate="show"
                    >
                      <motion.div
                        layoutId="craft-timeline-title"
                        layoutCrossfade={false}
                        transition={timelineLayoutTransition}
                        className="relative"
                      >
                        <Heading
                          id="craft-timeline-heading"
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
                        layoutId="craft-timeline-subtitle"
                        layoutCrossfade={false}
                        transition={timelineLayoutTransition}
                        className="relative"
                      >
                        <motion.div variants={headingItem}>
                          <Text
                            size="lg"
                            className={cn(
                              "type-section-subtitle",
                              titleColorTransition,
                              headerThemeReady ? "text-ink-muted" : "text-white",
                            )}
                          >
                            {headingEyebrow}
                          </Text>
                        </motion.div>
                      </motion.div>
                      <span className="sr-only">{headingInstructions}</span>
                    </motion.div>
                    {enableTitleReveal ? (
                      <button
                        type="button"
                        className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                        onClick={handleTimelineCollapse}
                      >
                        Collapse
                      </button>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key="craft-timeline-title-collapsed"
                    className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                    initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                    animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                    exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                    transition={motionEnabled ? timelineRevealFast : undefined}
                  >
                    <motion.div
                      layoutId="craft-timeline-title"
                      layoutCrossfade={false}
                      transition={timelineLayoutTransition}
                      className="relative inline-flex text-white"
                    >
                      <Heading
                        id="craft-timeline-heading"
                        level={2}
                        size="xl"
                        className="type-section-collapsed"
                      >
                        {headingTitle}
                      </Heading>
                      <button
                        type="button"
                        className="absolute inset-0 z-10 cursor-pointer focus-ring"
                        onPointerEnter={handleTimelineExpand}
                        onFocus={handleTimelineExpand}
                        onClick={handleTimelineExpand}
                        aria-expanded={revealTimeline}
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
                      <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                        {headingEyebrow}
                      </Text>
                    </motion.div>
                    <motion.div
                      initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                      animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                      exit={motionEnabled ? { opacity: 0, y: 6, transition: timelineRevealFast } : undefined}
                      className="mt-3"
                    >
                      <Text
                        size="button"
                        className="text-white/80 cursor-pointer focus-ring"
                        asChild
                      >
                        <button type="button" onClick={handleTimelineExpand}>
                        Read more
                        </button>
                      </Text>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>

            <AnimatePresence initial={false}>
              {revealTimeline ? (
                <motion.div
                  key="craft-timeline-body"
                  id="craft-timeline-body"
                  className="space-y-6"
                  initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                  animate={
                    motionEnabled
                      ? { opacity: 1, y: 0, filter: "blur(0px)", transition: timelineBodyReveal }
                      : undefined
                  }
                  exit={
                    motionEnabled
                      ? { opacity: 0, y: -16, filter: "blur(10px)", transition: timelineCollapse }
                      : undefined
                  }
                >
                  {enablePinned ? (
                    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                      <div className="space-y-4 border-none bg-card/0 p-4 shadow-none sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none">
                        <Text size="label-tight" className="mb-3 text-ink">
                          {alternateTitle}
                        </Text>
                        <LayoutGroup id="home-timeline-controls">
                          <div className="space-y-1">
                            {stages.map((stage, index) => (
                              <TimelineControlButton
                                key={`control-${stage.id}`}
                                label={stage.title}
                                order={stage.order}
                                active={resolvedActiveStage === index}
                                onSelect={() => { setActiveStage(index); }}
                                animationsEnabled={animationsEnabled}
                              />
                            ))}
                          </div>
                        </LayoutGroup>
                      </div>

                      <div className="space-y-5">
                        <div
                          className={cn(
                            "relative min-h-[640px] overflow-hidden rounded-3xl border",
                            focusSurfaceTransition,
                            revealPhotoFocus
                              ? "border-border/70 bg-card/70 shadow-elevated ring-1 ring-border/70 backdrop-blur-sm"
                              : "border-transparent bg-transparent shadow-none ring-0 backdrop-blur-none",
                          )}
                        >
                          <AnimatePresence initial={false} mode="popLayout">
                            {stages[resolvedActiveStage] ? (
                              <PinnedStagePanel
                                key={`panel-${stages[resolvedActiveStage].id}`}
                                stage={stages[resolvedActiveStage]}
                                animationsEnabled={animationsEnabled}
                                revealPhotoFocus={revealPhotoFocus}
                              />
                            ) : null}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Text size="label-tight" className="text-ink-muted">
                          {alternateTitle}
                        </Text>
                      </div>

                      <div className="space-y-3">
                        {stages.map((stage, index) => {
                          const expanded = activeStage === index;
                          const panelId = `craft-stage-panel-${stage.id}`;
                          const buttonId = `craft-stage-trigger-${stage.id}`;

                          return (
                            <motion.div
                              key={`stacked-${stage.id}`}
                              className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:p-4"
                              initial={motionEnabled ? { opacity: 0, y: 18, filter: "blur(10px)" } : false}
                              whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                              viewport={motionEnabled ? { once: true, amount: 0.25 } : undefined}
                              transition={motionEnabled ? homeMotion.revealFast : undefined}
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

                              <div
                                id={panelId}
                                aria-labelledby={buttonId}
                                className={cn(
                                  "mt-3 overflow-hidden transition-all duration-300",
                                  expanded
                                    ? "max-h-[999px] opacity-100"
                                    : "max-h-0 opacity-0",
                                )}
                              >
                                {expanded && (
                                  <div className="mt-2">
                                    <TimelineItem stage={stage} />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 sm:pt-4">
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
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
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
    hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
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
        initial={motionEnabled ? { clipPath: "inset(0 0 100% 0)" } : undefined}
        animate={motionEnabled ? { clipPath: "inset(0 0 0% 0)" } : undefined}
        transition={motionEnabled ? homeMotion.reveal : undefined}
      >
        <Image
          src={stage.media.url}
          alt={stage.media.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-1400 ease-out will-change-transform group-hover:scale-[1.04]"
          priority={stage.order === 1}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
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
      initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
      transition={homeMotion.revealFast}
    >
      {media}
    </Wrapper>
  );
}
