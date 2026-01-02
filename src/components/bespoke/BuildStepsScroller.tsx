"use client";

import NextImage from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import useMeasure from "react-use-measure";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
import {
  CONTAINER_EXPAND_MS,
  EASE_CINEMATIC,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
  GLASS_REVEAL_MS,
  STAGGER_BODY_ITEMS_MS,
  STAGGER_HEADER_ITEMS_MS,
  STAGGER_LIST_ITEMS_MS,
} from "@/motion/expandableSectionMotion";
import { createExpandableSectionVariants } from "@/motion/createExpandableSectionVariants";
import { useExpandableSectionTimeline } from "@/motion/useExpandableSectionTimeline";
import { cn } from "@/lib/utils";
import { Heading, Text } from "@/components/ui";

type BuildStepsScrollerProps = Readonly<{
  steps: FittingStage[];
  intro?: {
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    background?: { url: string; alt?: string; aspectRatio?: number };
  };
  initialStepId?: string;
  onStepView?: (id: string) => void;
  onStepCta?: (id: string) => void;
  pinnedBreakpoint?: "lg" | "xl"; // reserved for future layout options
  reduceMotion?: boolean;
  skipTargetId?: string;
}>;

type BuildStepsRevealSectionProps = {
  readonly steps: readonly FittingStage[];
  readonly heading: string;
  readonly subheading: string;
  readonly ctaLabel: string;
  readonly background: { url: string; alt?: string; aspectRatio?: number };
  readonly initialStepId?: string;
  readonly onStepView?: (id: string) => void;
  readonly onStepCta?: (id: string) => void;
  readonly skipTargetId?: string;
  readonly enableTitleReveal: boolean;
  readonly motionEnabled: boolean;
  readonly sectionRef: RefObject<HTMLElement | null>;
};

type StepDetailProps = {
  readonly open: boolean;
  readonly motionEnabled: boolean;
  readonly children: ReactNode;
};

const STEP_DETAIL_DURATION_MS = 250;

const StepDetail = ({ open, motionEnabled, children }: StepDetailProps) => {
  const [measureRef, { height }] = useMeasure();
  const transition = {
    duration: motionEnabled ? STEP_DETAIL_DURATION_MS / 1000 : 0,
    ease: EASE_CINEMATIC,
  };

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transition}
          className="overflow-hidden"
        >
          <div ref={measureRef} className="space-y-4 pt-4">
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export function BuildStepsScroller({
  steps,
  intro,
  initialStepId,
  onStepView,
  onStepCta,
  reduceMotion,
  skipTargetId = "build-steps-end",
}: BuildStepsScrollerProps) {
  const trackerRef = useAnalyticsObserver("BuildStepsSeen");
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? prefersReducedMotion;
  const motionEnabled = !shouldReduceMotion;
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enableTitleReveal = isDesktop && !shouldReduceMotion;
  const buildStepsKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const mappedSteps = useMemo(() => steps, [steps]);

  const background = intro?.background ?? {
    url: "/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg",
    alt: "Perazzi bespoke build steps background",
  };
  const heading = intro?.heading ?? "The journey";
  const subheading = intro?.subheading ?? "Six moments that shape a bespoke Perazzi";
  const ctaLabel = intro?.ctaLabel ?? "Begin the ritual";

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
    >
      <BuildStepsRevealSection
        key={buildStepsKey}
        steps={mappedSteps}
        heading={heading}
        subheading={subheading}
        ctaLabel={ctaLabel}
        background={background}
        initialStepId={initialStepId}
        onStepView={onStepView}
        onStepCta={onStepCta}
        skipTargetId={skipTargetId}
        enableTitleReveal={enableTitleReveal}
        motionEnabled={motionEnabled}
        sectionRef={trackerRef}
      />

      {skipTargetId ? (
        <div id={skipTargetId} className="sr-only" tabIndex={-1}>
          Step-by-step overview complete.
        </div>
      ) : null}
    </section>
  );
}

const BuildStepsRevealSection = ({
  steps,
  heading,
  subheading,
  ctaLabel,
  background,
  initialStepId,
  onStepView,
  onStepCta,
  skipTargetId,
  enableTitleReveal,
  motionEnabled,
  sectionRef,
}: BuildStepsRevealSectionProps) => {
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | undefined>(
    () => initialStepId ?? steps[0]?.id,
  );
  const [openStepId, setOpenStepId] = useState<string | undefined>(undefined);

  const buildStepsShellRef = useRef<HTMLDivElement | null>(null);
  const headerThemeFrame = useRef<number | null>(null);
  const seenStepsRef = useRef(new Set<string>());
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    expanded,
    phase,
    open,
    close,
    onTriggerKeyDown,
    onEscapeKeyDown,
    showExpanded,
    showCollapsed,
  } = useExpandableSectionTimeline({ defaultExpanded: !enableTitleReveal });

  const resolvedActiveStepId = steps.some((step) => step.id === activeStepId)
    ? activeStepId
    : steps[0]?.id;
  const resolvedOpenStepId = steps.some((step) => step.id === openStepId)
    ? openStepId
    : undefined;

  const revealBuildSteps = phase === "expanded" || phase === "closingHold";
  const revealPhotoFocus = revealBuildSteps;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealBuildSteps && motionEnabled;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter]";
  const titleColorTransition = "transition-colors";
  const cinematicBezier = `cubic-bezier(${EASE_CINEMATIC.join(",")})`;
  const transitionStyle = (durationMs: number) => ({
    transitionDuration: `${motionEnabled ? Math.round(durationMs * EXPAND_TIME_SCALE) : 0}ms`,
    transitionTimingFunction: motionEnabled ? cinematicBezier : "linear",
  });
  const focusSurfaceStyle = transitionStyle(GLASS_REVEAL_MS);
  const titleColorStyle = transitionStyle(EXPANDED_HEADER_REVEAL_MS);
  const buildStepsLayoutTransition = motionEnabled
    ? {
        layout: {
          duration: (CONTAINER_EXPAND_MS / 1000) * EXPAND_TIME_SCALE,
          ease: EASE_CINEMATIC,
        },
      }
    : undefined;
  const buildStepsMinHeight = enableTitleReveal ? "min-h-[calc(80vh+16rem)]" : null;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", parallaxEnabled ? parallaxStrength : "0%"],
  );
  const parallaxStyle = parallaxEnabled ? { y: parallaxY } : undefined;
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
    blurPx: 8,
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
  const slotContext = {
    collapsed: {},
    prezoom: {},
    expanded: {},
    closingHold: {},
  } as const;
  const headerItem = slotVariants.expandedHeader;
  const collapsedHeaderItem = slotVariants.collapsedHeader;
  const bodyItem = slotVariants.content;
  const ctaItem = slotVariants.ctaRow;
  const surfaceItem = surfaceVariants.content;
  const glassStyle = {
    ...(enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : {}),
    ...focusSurfaceStyle,
  };

  const instructions =
    "Swipe horizontally or use the arrows/tabs to move from moment to moment. Each step is a chapter in the ritual of building a Perazzi to your measure.";

  const handleBuildStepsExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    open();
    headerThemeFrame.current = requestAnimationFrame(() => {
      setHeaderThemeReady(true);
      headerThemeFrame.current = null;
    });
  };

  const handleBuildStepsCollapse = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
      headerThemeFrame.current = null;
    }
    setHeaderThemeReady(false);
    close();
  };

  const handleStepEnter = useCallback(
    (stepId: string) => {
      setActiveStepId((prev) => (prev === stepId ? prev : stepId));

      if (seenStepsRef.current.has(stepId)) return;
      seenStepsRef.current.add(stepId);
      logAnalytics(`BuildStepActive:${stepId}`);
      onStepView?.(stepId);
    },
    [onStepView],
  );

  const scrollToStep = useCallback(
    (index: number) => {
      const step = steps[index];
      const el = stepRefs.current[index];
      const container = scrollContainerRef.current;
      if (!step || !el) return;

      if (container) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = elRect.left - containerRect.left + container.scrollLeft;
        container.scrollTo({ left: offset, behavior: "smooth" });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    },
    [steps],
  );

  const handleRailClick = (index: number) => {
    const step = steps[index];
    if (!step) return;
    scrollToStep(index);
    logAnalytics(`BuildStepRailJump:${step.id}`);
  };

  const toggleStepOpen = (stepId: string) => {
    setOpenStepId((prev) => (prev === stepId ? undefined : stepId));
  };

  const handleMobileDotClick = (event: MouseEvent<HTMLButtonElement>, stepId: string) => {
    event.stopPropagation();
    const targetIndex = steps.findIndex((step) => step.id === stepId);
    if (targetIndex !== -1) {
      handleRailClick(targetIndex);
    }
  };

  const activeStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === resolvedActiveStepId),
  );
  const canScrollPrev = activeStepIndex > 0;
  const canScrollNext = activeStepIndex < steps.length - 1;

  const handlePrevClick = () => {
    if (canScrollPrev) {
      scrollToStep(activeStepIndex - 1);
    }
  };

  const handleNextClick = () => {
    if (canScrollNext) {
      scrollToStep(activeStepIndex + 1);
    }
  };

  const updateActiveStepFromScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || steps.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    steps.forEach((_, index) => {
      const el = stepRefs.current[index];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.left + rect.width / 2;
      const distance = Math.abs(containerCenter - elCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== -1) {
      handleStepEnter(steps[closestIndex].id);
    }
  }, [handleStepEnter, steps]);

  useEffect(() => {
    if (!revealBuildSteps) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateActiveStepFromScroll();
      });
    };

    const onScroll = () => {
      scheduleUpdate();
    };

    scheduleUpdate();
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      container.removeEventListener("scroll", onScroll);
    };
  }, [revealBuildSteps, updateActiveStepFromScroll]);

  useEffect(() => {
    if (!enableTitleReveal || !revealBuildSteps) return;
    const node = buildStepsShellRef.current;
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
  }, [enableTitleReveal, revealBuildSteps, resolvedActiveStepId, resolvedOpenStepId, steps.length]);

  useEffect(() => () => {
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
  }, []);

  return (
    <motion.div
      variants={slotContext}
      initial={motionEnabled ? "collapsed" : false}
      animate={phase}
    >
      <motion.div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute inset-0" variants={slotVariants.background}>
          <motion.div className="absolute inset-0 will-change-transform" style={parallaxStyle}>
            <NextImage
              src={background.url}
              alt={background.alt ?? "Perazzi bespoke build steps background"}
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
              loading="lazy"
            />
          </motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" variants={scrimInverted}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div className="absolute inset-0 bg-(--scrim-strong)" aria-hidden />
        </motion.div>
        <motion.div className="absolute inset-0" variants={slotVariants.scrimBottom}>
          <div
            className="pointer-events-none absolute inset-0 film-grain opacity-20"
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-6 lg:px-10">
        <motion.div
          ref={buildStepsShellRef}
          style={glassStyle}
          className={cn(
            "relative flex w-full flex-col space-y-8 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            buildStepsMinHeight,
          )}
          variants={slotVariants.glass}
          onKeyDown={onEscapeKeyDown}
        >
          <LayoutGroup id="bespoke-build-steps-title">
            {showExpanded ? (
              <motion.div
                key="build-steps-header"
                className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div className="space-y-3" variants={headerGroup}>
                  <motion.div variants={headerItem}>
                    <motion.div
                      layoutId="bespoke-build-steps-title"
                      layoutCrossfade={false}
                      transition={buildStepsLayoutTransition}
                      className="relative"
                    >
                      <Heading
                        id="build-steps-heading"
                        level={2}
                        size="xl"
                        className={cn(
                          titleColorTransition,
                          headerThemeReady ? "text-ink" : "text-white",
                        )}
                        style={titleColorStyle}
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                  </motion.div>
                  <motion.div variants={headerItem}>
                    <motion.div
                      layoutId="bespoke-build-steps-subtitle"
                      layoutCrossfade={false}
                      transition={buildStepsLayoutTransition}
                      className="relative"
                    >
                      <Text
                        size="lg"
                        className={cn(
                          "type-section-subtitle",
                          titleColorTransition,
                          headerThemeReady ? "text-ink-muted" : "text-white",
                        )}
                        style={titleColorStyle}
                        leading="relaxed"
                      >
                        {subheading}
                      </Text>
                    </motion.div>
                  </motion.div>
                  <motion.div variants={headerItem}>
                    <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                      {instructions}
                    </Text>
                  </motion.div>
                  <motion.div variants={headerItem} className="flex flex-wrap items-center gap-4">
                    <a
                      href="#build-steps-sequence"
                      className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-ink/60 text-ink transition hover:border-ink hover:translate-x-0.5 focus-ring"
                    >
                      <span>{ctaLabel}</span>
                      <span aria-hidden="true">↓</span>
                    </a>
                    {skipTargetId ? (
                      <a
                        href={`#${skipTargetId}`}
                        className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-perazzi-red/60 text-perazzi-red transition hover:border-perazzi-red hover:text-perazzi-red hover:translate-x-0.5 focus-ring"
                      >
                        <span>Skip step-by-step</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : null}
                  </motion.div>
                </motion.div>
                {enableTitleReveal ? (
                  <motion.button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                    onClick={handleBuildStepsCollapse}
                    variants={surfaceItem}
                  >
                    Collapse
                  </motion.button>
                ) : null}
              </motion.div>
            ) : null}
            {showCollapsed ? (
              <motion.div
                key="build-steps-collapsed"
                className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div variants={headerGroup} className="flex flex-col items-center gap-3">
                  <motion.div
                    layoutId="bespoke-build-steps-title"
                    layoutCrossfade={false}
                    transition={buildStepsLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Heading
                        id="build-steps-heading"
                        level={2}
                        size="xl"
                        className="type-section-collapsed"
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onPointerEnter={handleBuildStepsExpand}
                      onFocus={handleBuildStepsExpand}
                      onClick={handleBuildStepsExpand}
                      onKeyDown={onTriggerKeyDown}
                      aria-expanded={expanded}
                      aria-controls="build-steps-body"
                      aria-labelledby="build-steps-heading"
                    >
                      <span className="sr-only">Expand {heading}</span>
                    </button>
                  </motion.div>
                  <motion.div
                    layoutId="bespoke-build-steps-subtitle"
                    layoutCrossfade={false}
                    transition={buildStepsLayoutTransition}
                    className="relative text-white"
                  >
                    <motion.div variants={collapsedHeaderItem}>
                      <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                        {subheading}
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
                      <button type="button" onClick={handleBuildStepsExpand} onKeyDown={onTriggerKeyDown}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </LayoutGroup>

          <motion.div
            variants={slotContext}
            initial={motionEnabled ? "collapsed" : false}
            animate={phase}
          >
            {showExpanded ? (
              <motion.div
                key="build-steps-body"
                id="build-steps-body"
                className="space-y-6"
                variants={slotContext}
                initial={motionEnabled ? "collapsed" : false}
                animate={phase}
              >
                <motion.div id="build-steps-sequence" className="relative" variants={bodyGroup}>
                  <div className="flex min-w-0">
                    <div className="relative flex-1 min-w-0">
                      <motion.nav
                        className="absolute inset-x-3 top-3 z-20 hidden lg:block sm:inset-x-4 lg:inset-x-6 lg:top-4"
                        variants={bodyItem}
                      >
                        <LayoutGroup id="bespoke-build-step-rail">
                          <motion.div className="flex items-center gap-3" variants={itemsGroup}>
                            <motion.button
                              type="button"
                              onClick={handlePrevClick}
                              disabled={!canScrollPrev}
                              aria-label="Previous step"
                              className={cn(
                                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-ink-muted transition focus-ring",
                                canScrollPrev
                                  ? "hover:border-border hover:text-ink"
                                  : "cursor-not-allowed opacity-40",
                              )}
                              variants={surfaceItem}
                            >
                              <span aria-hidden="true">←</span>
                            </motion.button>

                            <motion.div
                              className="grid flex-1 grid-flow-col auto-cols-fr items-center gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 type-label-tight text-ink-muted shadow-soft backdrop-blur-md"
                              variants={itemsGroup}
                            >
                              {steps.map((step, index) => {
                                const isActive = step.id === resolvedActiveStepId;
                                const stepNumber = index + 1;

                                return (
                                  <motion.button
                                    key={step.id}
                                    type="button"
                                    onClick={() => { handleRailClick(index); }}
                                    aria-label={`Go to step ${stepNumber}: ${step.title}`}
                                    aria-current={isActive ? "step" : undefined}
                                    className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent px-3 py-1.5 transition focus-ring ${
                                      isActive
                                        ? "text-white"
                                        : "text-ink-muted hover:text-ink"
                                    }`}
                                    variants={surfaceItem}
                                    whileHover={motionEnabled ? { y: -1, transition: homeMotion.micro } : undefined}
                                    whileTap={motionEnabled ? { y: 0, transition: homeMotion.micro } : undefined}
                                  >
                                    {isActive ? (
                                      motionEnabled ? (
                                        <motion.span
                                          layoutId="bespoke-build-step-rail-highlight"
                                          className="absolute inset-0 rounded-full bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                          transition={homeMotion.springHighlight}
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <span
                                          className="absolute inset-0 rounded-full bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                                          aria-hidden="true"
                                        />
                                      )
                                    ) : null}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                      <span
                                        className={`h-2 w-2 rounded-full border transition ${
                                          isActive ? "border-white/40 bg-white/85" : "border-border bg-card"
                                        }`}
                                        aria-hidden="true"
                                      />
                                      <span>{`Step ${stepNumber}`}</span>
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </motion.div>

                            <motion.button
                              type="button"
                              onClick={handleNextClick}
                              disabled={!canScrollNext}
                              aria-label="Next step"
                              className={cn(
                                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-ink-muted transition focus-ring",
                                canScrollNext
                                  ? "hover:border-border hover:text-ink"
                                  : "cursor-not-allowed opacity-40",
                              )}
                              variants={surfaceItem}
                            >
                              <span aria-hidden="true">→</span>
                            </motion.button>
                          </motion.div>
                        </LayoutGroup>
                      </motion.nav>

                      <motion.div
                        className="flex h-[80vh] w-full min-w-0 overflow-x-auto overflow-y-hidden rounded-2xl border border-border/70 bg-card/30 shadow-soft backdrop-blur-sm snap-x snap-proximity lg:pt-24 sm:rounded-3xl"
                        ref={scrollContainerRef}
                        variants={itemsGroup}
                      >
                        {steps.map((step, index) => {
                          const isImage =
                            step.media?.kind === "image" && step.media.url;
                          const isOpen = resolvedOpenStepId === step.id;

                          return (
                            <motion.article
                              key={step.id}
                              ref={(el) => {
                                stepRefs.current[index] = el;
                              }}
                              data-step-id={step.id}
                              aria-labelledby={`build-step-heading-${step.id}`}
                              className="group relative w-full shrink-0 snap-start"
                              variants={bodyItem}
                            >
                              <div className="relative flex h-full">
                                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                  {isImage ? (
                                    <NextImage
                                      src={step.media.url}
                                      alt={step.media.alt ?? step.title}
                                      fill
                                      sizes="100vw"
                                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                      loading="lazy"
                                    />
                                  ) : null}
                                  <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
                                  <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
                                  <div className="pointer-events-none absolute inset-0 overlay-gradient-ink-50" aria-hidden />
                                </div>

                                <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
                                  <div className="mx-auto max-h-full max-w-3xl overflow-y-auto rounded-2xl border border-border/75 bg-card/80 p-5 shadow-elevated ring-1 ring-border/70 backdrop-blur-md sm:rounded-3xl sm:p-6">
                                    <button
                                      type="button"
                                      className="flex w-full flex-col items-start gap-3 text-left"
                                      aria-expanded={isOpen}
                                      onClick={() => { toggleStepOpen(step.id); }}
                                    >
                                      <div className="w-full space-y-1">
                                        <Heading
                                          id={`build-step-heading-${step.id}`}
                                          level={3}
                                          size="lg"
                                          className="type-card-title text-ink text-2xl sm:text-3xl"
                                        >
                                          {step.title}
                                        </Heading>
                                      </div>
                                      <span className="type-label-tight text-perazzi-red/70">
                                        {isOpen ? "Collapse" : "Read More"}
                                      </span>
                                    </button>

                                    <StepDetail open={isOpen} motionEnabled={motionEnabled}>
                                      {step.bodyHtml ? (
                                        <SafeHtml
                                          className="max-w-none type-body text-ink-muted"
                                          html={step.bodyHtml}
                                        />
                                      ) : null}
                                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                        {step.ctaHref && step.ctaLabel ? (
                                          <a
                                            href={step.ctaHref}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              onStepCta?.(step.id);
                                            }}
                                            className="inline-flex min-h-10 items-center justify-center gap-2 pill border border-perazzi-red/60 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
                                          >
                                            {step.ctaLabel}
                                            <span aria-hidden="true">→</span>
                                          </a>
                                        ) : (
                                          <span className="type-label-tight text-ink-muted">
                                            Bespoke moment {index + 1}
                                          </span>
                                        )}

                                        <div className="flex items-center gap-2 lg:hidden">
                                          <button
                                            type="button"
                                            onClick={handlePrevClick}
                                            disabled={!canScrollPrev}
                                            aria-label="Previous step"
                                            className={cn(
                                              "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card/80 text-ink-muted transition focus-ring",
                                              canScrollPrev
                                                ? "hover:border-border hover:text-ink"
                                                : "cursor-not-allowed opacity-40",
                                            )}
                                          >
                                            <span aria-hidden="true">←</span>
                                          </button>
                                          {steps.map((mappedStep) => {
                                            const dotActive = mappedStep.id === resolvedActiveStepId;
                                            return (
                                              <button
                                                key={mappedStep.id}
                                                type="button"
                                                onClick={(event) =>
                                                  { handleMobileDotClick(event, mappedStep.id); }
                                                }
                                                aria-label={`Go to step ${
                                                  steps.findIndex((stepItem) => stepItem.id === mappedStep.id) + 1
                                                }`}
                                                aria-current={dotActive ? "step" : undefined}
                                                className={`h-2.5 w-2.5 rounded-full border border-border transition ${
                                                  dotActive ? "bg-perazzi-red" : "bg-card"
                                                }`}
                                              />
                                            );
                                          })}
                                          <button
                                            type="button"
                                            onClick={handleNextClick}
                                            disabled={!canScrollNext}
                                            aria-label="Next step"
                                            className={cn(
                                              "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card/80 text-ink-muted transition focus-ring",
                                              canScrollNext
                                                ? "hover:border-border hover:text-ink"
                                                : "cursor-not-allowed opacity-40",
                                            )}
                                          >
                                            <span aria-hidden="true">→</span>
                                          </button>
                                        </div>
                                      </div>
                                    </StepDetail>
                                  </div>
                                </div>
                              </div>
                            </motion.article>
                          );
                        })}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
