"use client";

import NextImage from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SafeHtml from "@/components/SafeHtml";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";
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
  const [buildStepsExpanded, setBuildStepsExpanded] = useState(!enableTitleReveal);
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

  const resolvedActiveStepId = steps.some((step) => step.id === activeStepId)
    ? activeStepId
    : steps[0]?.id;
  const resolvedOpenStepId = steps.some((step) => step.id === openStepId)
    ? openStepId
    : undefined;

  const revealBuildSteps = !enableTitleReveal || buildStepsExpanded;
  const revealPhotoFocus = revealBuildSteps;
  const parallaxStrength = "16%";
  const parallaxEnabled = enableTitleReveal && !revealBuildSteps;
  const focusSurfaceTransition =
    "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const focusFadeTransition =
    "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const titleColorTransition =
    "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const buildStepsReveal = { duration: 2.0, ease: homeMotion.cinematicEase };
  const buildStepsRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase };
  const buildStepsCollapse = { duration: 1.05, ease: homeMotion.cinematicEase };
  const buildStepsBodyReveal = buildStepsReveal;
  const readMoreReveal = motionEnabled
    ? { duration: 0.5, ease: homeMotion.cinematicEase, delay: buildStepsReveal.duration }
    : undefined;
  const buildStepsLayoutTransition = motionEnabled ? { layout: buildStepsReveal } : undefined;
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
  const backgroundScale = parallaxEnabled ? 1.32 : 1;
  const backgroundScaleTransition = revealBuildSteps ? buildStepsReveal : buildStepsCollapse;

  const instructions =
    "Scroll to move from moment to moment. Each step is a chapter in the ritual of building a Perazzi to your measure.";

  const headingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: motionEnabled ? 0.16 : 0 } },
  } as const;

  const headingItem = {
    hidden: { y: 14, filter: "blur(10px)" },
    show: { y: 0, filter: "blur(0px)", transition: buildStepsReveal },
  } as const;

  const handleBuildStepsExpand = () => {
    if (!enableTitleReveal) return;
    if (headerThemeFrame.current !== null) {
      cancelAnimationFrame(headerThemeFrame.current);
    }
    setBuildStepsExpanded(true);
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
    setBuildStepsExpanded(false);
  };

  const handleStepEnter = (stepId: string) => {
    setActiveStepId((prev) => (prev === stepId ? prev : stepId));

    if (seenStepsRef.current.has(stepId)) return;
    seenStepsRef.current.add(stepId);
    logAnalytics(`BuildStepActive:${stepId}`);
    onStepView?.(stepId);
  };

  const handleRailClick = (index: number) => {
    const step = steps[index];
    const el = stepRefs.current[index];
    const container = scrollContainerRef.current;
    if (!step || !el) return;

    if (container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: offset, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={parallaxStyle}
          initial={false}
          animate={motionEnabled ? { scale: backgroundScale } : undefined}
          transition={motionEnabled ? backgroundScaleTransition : undefined}
        >
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
        <div
          className={cn(
            "absolute inset-0 bg-(--scrim-strong)",
            focusFadeTransition,
            revealBuildSteps ? "opacity-0" : "opacity-100",
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-6 lg:px-10">
        <motion.div
          ref={buildStepsShellRef}
          style={enableTitleReveal && expandedHeight ? { minHeight: expandedHeight } : undefined}
          className={cn(
            "relative flex w-full flex-col space-y-8 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
            focusSurfaceTransition,
            revealPhotoFocus
              ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
              : "border-transparent bg-transparent shadow-none backdrop-blur-none",
            buildStepsMinHeight,
          )}
        >
          <LayoutGroup id="bespoke-build-steps-title">
            <AnimatePresence initial={false}>
              {revealBuildSteps ? (
                <motion.div
                  key="build-steps-header"
                  className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8"
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={motionEnabled ? { opacity: 1, transition: buildStepsReveal } : undefined}
                  exit={motionEnabled ? { opacity: 0, transition: buildStepsRevealFast } : undefined}
                >
                  <motion.div
                    className="space-y-3"
                    variants={headingContainer}
                    initial={motionEnabled ? "hidden" : false}
                    animate={motionEnabled ? "show" : undefined}
                  >
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
                      >
                        {heading}
                      </Heading>
                    </motion.div>
                    <motion.div
                      layoutId="bespoke-build-steps-subtitle"
                      layoutCrossfade={false}
                      transition={buildStepsLayoutTransition}
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
                          leading="relaxed"
                        >
                          {subheading}
                        </Text>
                      </motion.div>
                    </motion.div>
                    <motion.div variants={headingItem}>
                      <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
                        {instructions}
                      </Text>
                    </motion.div>
                    <motion.div variants={headingItem} className="flex flex-wrap items-center gap-4">
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
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center type-button text-ink-muted transition-colors hover:text-ink focus-ring md:mt-0"
                      onClick={handleBuildStepsCollapse}
                    >
                      Collapse
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="build-steps-collapsed"
                  className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : false}
                  animate={motionEnabled ? { opacity: 1, filter: "blur(0px)" } : undefined}
                  exit={motionEnabled ? { opacity: 0, filter: "blur(10px)" } : undefined}
                  transition={motionEnabled ? buildStepsRevealFast : undefined}
                >
                  <motion.div
                    layoutId="bespoke-build-steps-title"
                    layoutCrossfade={false}
                    transition={buildStepsLayoutTransition}
                    className="relative inline-flex text-white"
                  >
                    <Heading
                      id="build-steps-heading"
                      level={2}
                      size="xl"
                      className="type-section-collapsed"
                    >
                      {heading}
                    </Heading>
                    <button
                      type="button"
                      className="absolute inset-0 z-10 cursor-pointer focus-ring"
                      onPointerEnter={handleBuildStepsExpand}
                      onFocus={handleBuildStepsExpand}
                      onClick={handleBuildStepsExpand}
                      aria-expanded={revealBuildSteps}
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
                    <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
                      {subheading}
                    </Text>
                  </motion.div>
                  <motion.div
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={motionEnabled ? { opacity: 1, y: 0, transition: readMoreReveal } : undefined}
                    exit={motionEnabled ? { opacity: 0, y: 6, transition: buildStepsRevealFast } : undefined}
                    className="mt-3"
                  >
                    <Text
                      size="button"
                      className="text-white/80 cursor-pointer focus-ring"
                      asChild
                    >
                      <button type="button" onClick={handleBuildStepsExpand}>
                        Read more
                      </button>
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {revealBuildSteps ? (
              <motion.div
                key="build-steps-body"
                id="build-steps-body"
                className="space-y-6"
                initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(12px)" } : false}
                animate={
                  motionEnabled
                    ? { opacity: 1, y: 0, filter: "blur(0px)", transition: buildStepsBodyReveal }
                    : undefined
                }
                exit={
                  motionEnabled
                    ? { opacity: 0, y: -16, filter: "blur(10px)", transition: buildStepsCollapse }
                    : undefined
                }
              >
                <div id="build-steps-sequence" className="relative">
                  <div className="flex">
                    <div className="relative flex-1">
                      <nav className="absolute inset-x-3 top-3 z-20 hidden lg:block sm:inset-x-4 lg:inset-x-6 lg:top-4">
                        <LayoutGroup id="bespoke-build-step-rail">
                          <div className="grid grid-flow-col auto-cols-fr items-center gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 type-label-tight text-ink-muted shadow-soft backdrop-blur-md">
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
                                  initial={false}
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
                                  <span
                                    className="relative z-10 flex items-center justify-center gap-2"
                                  >
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
                          </div>
                        </LayoutGroup>
                      </nav>

                      <div
                        className="overflow-y-auto rounded-2xl border border-border/70 bg-card/30 shadow-soft backdrop-blur-sm snap-y snap-mandatory lg:pt-24 sm:rounded-3xl h-[80vh]"
                        ref={scrollContainerRef}
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
                              className="group relative snap-start"
                              initial={
                                motionEnabled ? { opacity: 0, y: 16, filter: "blur(12px)" } : false
                              }
                              whileInView={
                                motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined
                              }
                              viewport={{ amount: 0.6, once: true }}
                              transition={motionEnabled ? homeMotion.revealFast : undefined}
                              onViewportEnter={() => { handleStepEnter(step.id); }}
                            >
                              <div className="relative flex min-h-[80vh]">
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
                                  <div className="mx-auto max-w-3xl rounded-2xl border border-border/75 bg-card/80 p-5 shadow-elevated ring-1 ring-border/70 backdrop-blur-md sm:rounded-3xl sm:p-6">
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

                                    <AnimatePresence initial={false}>
                                      {isOpen ? (
                                        <motion.div
                                          key="content"
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.25, ease: "easeOut" }}
                                          className="overflow-hidden"
                                        >
                                          <div className="space-y-4 pt-4">
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
                                                      aria-current={
                                                        dotActive ? "step" : undefined
                                                      }
                                                      className={`h-2.5 w-2.5 rounded-full border border-border transition ${
                                                        dotActive ? "bg-perazzi-red" : "bg-card"
                                                      }`}
                                                    />
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      ) : null}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>
                            </motion.article>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};
