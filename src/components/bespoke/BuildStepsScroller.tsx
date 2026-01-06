"use client";

import NextImage from "next/image";
import SafeHtml from "@/components/SafeHtml";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import type { FittingStage } from "@/types/build";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  buildChoreoPresenceVars,
  choreoDistance,
  dreamyPace,
} from "@/lib/choreo";
import {
  ChoreoGroup,
  ChoreoPresence,
  Heading,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";

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
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

type BuildStepsSequenceProps = Readonly<{
  steps: readonly FittingStage[];
  revealBuildSteps: boolean;
  resolvedActiveStepId?: string;
  resolvedOpenStepId?: string;
  stepRefs: RefObject<(HTMLElement | null)[]>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onRailClick: (index: number) => void;
  onToggleStepOpen: (stepId: string) => void;
  onStepCta?: (id: string) => void;
  onMobileDotClick: (event: MouseEvent<HTMLButtonElement>, stepId: string) => void;
}>;

type BuildStepsRailNavProps = Readonly<{
  steps: readonly FittingStage[];
  activeStepId?: string;
  onRailClick: (index: number) => void;
}>;

type BuildStepsStepListProps = Readonly<{
  steps: readonly FittingStage[];
  activeStepId?: string;
  openStepId?: string;
  stepRefs: RefObject<(HTMLElement | null)[]>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onToggleStepOpen: (stepId: string) => void;
  onStepCta?: (id: string) => void;
  onMobileDotClick: (event: MouseEvent<HTMLButtonElement>, stepId: string) => void;
}>;

type BuildStepsMobileDotsProps = Readonly<{
  steps: readonly FittingStage[];
  activeStepId?: string;
  onDotClick: (event: MouseEvent<HTMLButtonElement>, stepId: string) => void;
}>;

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
  const shouldReduceMotion = reduceMotion ?? false;
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHydrated = useHydrated();
  const enableTitleReveal = isHydrated && isDesktop && !shouldReduceMotion;
  const [isCollapsed, setIsCollapsed] = useState(enableTitleReveal);
  const buildStepsKey = enableTitleReveal ? "title-reveal" : "always-reveal";

  const mappedSteps = useMemo(() => steps, [steps]);

  const background = intro?.background ?? {
    url: "/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg",
    alt: "Perazzi bespoke build steps background",
  };
  const heading = intro?.heading ?? "The journey";
  const subheading = intro?.subheading ?? "Six moments that shape a bespoke Perazzi";
  const ctaLabel = intro?.ctaLabel ?? "Begin the ritual";

  useEffect(() => {
    setIsCollapsed(enableTitleReveal);
  }, [enableTitleReveal]);

  return (
    <section
      ref={trackerRef}
      aria-labelledby="build-steps-heading"
      data-analytics-id="BuildStepsSeen"
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-16 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-500 before:ease-out before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-16 after:bg-linear-to-t after:from-black/55 after:to-transparent after:transition-opacity after:duration-500 after:ease-out after:content-['']",
        isCollapsed ? "before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0",
      )}
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
        onCollapsedChange={setIsCollapsed}
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
  onCollapsedChange,
}: BuildStepsRevealSectionProps) => {
  const [buildStepsExpanded, setBuildStepsExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [activeStepId, setActiveStepId] = useState<string | undefined>(
    () => initialStepId ?? steps[0]?.id,
  );
  const [openStepId, setOpenStepId] = useState<string | undefined>(undefined);

  const seenStepsRef = useRef(new Set<string>());
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const resolvedActiveStepId = steps.some((step) => step.id === activeStepId)
    ? activeStepId
    : steps[0]?.id;
  const resolvedOpenStepId = steps.some((step) => step.id === openStepId)
    ? openStepId
    : undefined;

  const revealBuildSteps = !enableTitleReveal || buildStepsExpanded;
  const revealPhotoFocus = revealBuildSteps;
  const buildStepsMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: buildStepsShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealBuildSteps,
    deps: [resolvedActiveStepId, resolvedOpenStepId, steps.length],
  });
  const revealBuildStepsForMeasure = revealBuildSteps || isPreparing;

  const instructions =
    "Scroll to move from moment to moment. Each step is a chapter in the ritual of building a Perazzi to your measure.";

  const handleBuildStepsExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setBuildStepsExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleBuildStepsCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setBuildStepsExpanded(false);
    onCollapsedChange?.(true);
  };

  const handleStepEnter = useCallback((stepId: string) => {
    setActiveStepId((prev) => (prev === stepId ? prev : stepId));

    if (seenStepsRef.current.has(stepId)) return;
    seenStepsRef.current.add(stepId);
    logAnalytics(`BuildStepActive:${stepId}`);
    onStepView?.(stepId);
  }, [onStepView]);

  const handleRailClick = (index: number) => {
    const step = steps[index];
    const el = stepRefs.current[index];
    const container = scrollContainerRef.current;
    if (!step || !el) return;

    if (container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: offset, behavior: "auto" });
    } else {
      el.scrollIntoView({ behavior: "auto", block: "start" });
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
    if (!revealBuildSteps) return;
    if (typeof IntersectionObserver === "undefined") return;

    const root = scrollContainerRef.current ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          if (!(target instanceof HTMLElement)) return;
          const stepId = target.dataset.stepId;
          if (stepId) handleStepEnter(stepId);
        });
      },
      { root, threshold: 0.6 },
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [handleStepEnter, revealBuildSteps, steps.length]);

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <BuildStepsExpandedHeader
          headingId="build-steps-heading"
          heading={heading}
          subheading={subheading}
          instructions={instructions}
          ctaLabel={ctaLabel}
          skipTargetId={skipTargetId}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={handleBuildStepsCollapse}
        />
      </RevealItem>

      <RevealGroup delayMs={140}>
        <RevealItem index={0}>
          <BuildStepsSequence
            steps={steps}
            revealBuildSteps={revealBuildStepsForMeasure}
            resolvedActiveStepId={resolvedActiveStepId}
            resolvedOpenStepId={resolvedOpenStepId}
            stepRefs={stepRefs}
            scrollContainerRef={scrollContainerRef}
            onRailClick={handleRailClick}
            onToggleStepOpen={toggleStepOpen}
            onStepCta={onStepCta}
            onMobileDotClick={handleMobileDotClick}
          />
        </RevealItem>
      </RevealGroup>
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt ?? "Perazzi bespoke build steps background" }}
        reveal={revealBuildSteps}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealBuildSteps}
        overlay="canvas"
        loading="lazy"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-6 lg:px-10">
        <SectionShell
          ref={buildStepsShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={buildStepsMinHeight ?? undefined}
          className="space-y-8 w-full"
        >
          {revealBuildSteps ? (
            expandedContent
          ) : (
            <>
              <ChoreoGroup
                effect="fade-lift"
                distance={choreoDistance.base}
                durationMs={dreamyPace.textMs}
                easing={dreamyPace.easing}
                staggerMs={dreamyPace.staggerMs}
                itemClassName="absolute inset-0"
              >
                <RevealCollapsedHeader
                  headingId="build-steps-heading"
                  heading={heading}
                  subheading={subheading}
                  controlsId="build-steps-body"
                  expanded={revealBuildSteps}
                  onExpand={handleBuildStepsExpand}
                />
              </ChoreoGroup>
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </div>
    </>
  );
};

const BuildStepsSequence = ({
  steps,
  revealBuildSteps,
  resolvedActiveStepId,
  resolvedOpenStepId,
  stepRefs,
  scrollContainerRef,
  onRailClick,
  onToggleStepOpen,
  onStepCta,
  onMobileDotClick,
}: BuildStepsSequenceProps) => {
  if (!revealBuildSteps) return null;

  return (
    <div id="build-steps-body" className="space-y-6">
      <div id="build-steps-sequence" className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <BuildStepsRailNav
              steps={steps}
              activeStepId={resolvedActiveStepId}
              onRailClick={onRailClick}
            />

            <BuildStepsStepList
              steps={steps}
              activeStepId={resolvedActiveStepId}
              openStepId={resolvedOpenStepId}
              stepRefs={stepRefs}
              scrollContainerRef={scrollContainerRef}
              onToggleStepOpen={onToggleStepOpen}
              onStepCta={onStepCta}
              onMobileDotClick={onMobileDotClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const BuildStepsRailNav = ({ steps, activeStepId, onRailClick }: BuildStepsRailNavProps) => {
  const indicatorVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterScale: 0.98,
    exitScale: 0.98,
    enterY: 0,
    exitY: 0,
  });

  return (
    <nav className="absolute inset-x-3 top-3 z-20 hidden lg:block sm:inset-x-4 lg:inset-x-6 lg:top-4">
      <ChoreoGroup
        effect="slide"
        axis="x"
        direction="left"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="grid grid-flow-col auto-cols-fr items-center gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 type-label-tight text-ink-muted shadow-soft backdrop-blur-md"
        itemAsChild
      >
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const stepNumber = index + 1;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => { onRailClick(index); }}
              aria-label={`Go to step ${stepNumber}: ${step.title}`}
              aria-current={isActive ? "step" : undefined}
              className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent px-3 py-1.5 focus-ring ${
                isActive
                  ? "text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {isActive ? (
                <ChoreoPresence
                  state="enter"
                  style={indicatorVars}
                  asChild
                >
                  <span
                    className="absolute inset-0 rounded-full bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                    aria-hidden="true"
                  />
                </ChoreoPresence>
              ) : null}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full border ${
                    isActive ? "border-white/40 bg-white/85" : "border-border bg-card"
                  }`}
                  aria-hidden="true"
                />
                <span>{`Step ${stepNumber}`}</span>
              </span>
            </button>
          );
        })}
      </ChoreoGroup>
    </nav>
  );
};

const BuildStepsStepList = ({
  steps,
  activeStepId,
  openStepId,
  stepRefs,
  scrollContainerRef,
  onToggleStepOpen,
  onStepCta,
  onMobileDotClick,
}: BuildStepsStepListProps) => {
  const bodyPresenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterY: choreoDistance.tight,
    exitY: choreoDistance.tight,
  });

  return (
    <div
      className="overflow-y-auto rounded-2xl border border-border/70 bg-card/30 shadow-soft backdrop-blur-sm snap-y snap-mandatory lg:pt-24 sm:rounded-3xl h-[80vh]"
      ref={scrollContainerRef}
    >
      {steps.map((step, index) => {
        const isImage = step.media?.kind === "image" && step.media.url;
        const isOpen = openStepId === step.id;
        const isActive = step.id === activeStepId;

        return (
          <article
            key={step.id}
            ref={(el) => {
              const current = stepRefs.current;
              if (!current) return;
              current[index] = el;
            }}
            data-step-id={step.id}
            aria-labelledby={`build-step-heading-${step.id}`}
            className="group relative snap-start"
          >
            <div className="relative flex min-h-[80vh]">
              <ChoreoGroup
                effect="scale-parallax"
                distance={choreoDistance.base}
                durationMs={dreamyPace.textMs}
                easing={dreamyPace.easing}
                scaleFrom={1.02}
                itemAsChild
              >
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  {isImage ? (
                    <NextImage
                      src={step.media.url}
                      alt={step.media.alt ?? step.title}
                      fill
                      sizes="100vw"
                      className="object-cover object-center"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </ChoreoGroup>
              <ChoreoPresence
                state={isActive ? "enter" : "exit"}
                style={bodyPresenceVars}
                asChild
              >
                <div className="pointer-events-none absolute inset-0 overlay-gradient-ink-50" aria-hidden />
              </ChoreoPresence>

              <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
                <ChoreoGroup
                  effect="fade-lift"
                  distance={choreoDistance.base}
                  durationMs={dreamyPace.textMs}
                  easing={dreamyPace.easing}
                  itemAsChild
                >
                  <div className="mx-auto max-w-3xl rounded-2xl border border-border/75 bg-card/80 p-5 shadow-elevated ring-1 ring-border/70 backdrop-blur-md sm:rounded-3xl sm:p-6">
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-3 text-left"
                      aria-expanded={isOpen}
                      onClick={() => { onToggleStepOpen(step.id); }}
                    >
                      <ChoreoGroup
                        effect="fade-lift"
                        distance={choreoDistance.tight}
                        durationMs={dreamyPace.textMs}
                        easing={dreamyPace.easing}
                        staggerMs={dreamyPace.staggerMs}
                        className="w-full space-y-1"
                      >
                        <Heading
                          id={`build-step-heading-${step.id}`}
                          level={3}
                          size="lg"
                          className="type-card-title text-ink text-2xl sm:text-3xl"
                        >
                          {step.title}
                        </Heading>
                        <span className="type-label-tight text-perazzi-red/70">
                          {isOpen ? "Collapse" : "Read More"}
                        </span>
                      </ChoreoGroup>
                    </button>

                    <div
                      className={cn(
                        "overflow-hidden transition-[max-height] duration-500 ease-out",
                        isOpen ? "max-h-[520px]" : "max-h-0",
                      )}
                      aria-hidden={!isOpen}
                    >
                      <ChoreoPresence
                        state={isOpen ? "enter" : "exit"}
                        style={bodyPresenceVars}
                        className={cn(
                          "space-y-4 pt-4",
                          isOpen ? "pointer-events-auto" : "pointer-events-none",
                        )}
                      >
                        {step.bodyHtml ? (
                          <SafeHtml
                            className="max-w-none type-body text-ink-muted"
                            html={step.bodyHtml}
                          />
                        ) : null}
                        <ChoreoGroup
                          effect="fade-lift"
                          distance={choreoDistance.tight}
                          durationMs={dreamyPace.textMs}
                          easing={dreamyPace.easing}
                          staggerMs={dreamyPace.staggerMs}
                          className="flex flex-wrap items-center justify-between gap-4 pt-2"
                          itemAsChild
                        >
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

                          <BuildStepsMobileDots
                            steps={steps}
                            activeStepId={activeStepId}
                            onDotClick={onMobileDotClick}
                          />
                        </ChoreoGroup>
                      </ChoreoPresence>
                    </div>
                  </div>
                </ChoreoGroup>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const BuildStepsMobileDots = ({
  steps,
  activeStepId,
  onDotClick,
}: BuildStepsMobileDotsProps) => (
  <ChoreoGroup
    effect="scale-parallax"
    distance={choreoDistance.tight}
    durationMs={dreamyPace.textMs}
    easing={dreamyPace.easing}
    scaleFrom={0.96}
    staggerMs={dreamyPace.staggerMs}
    className="flex items-center gap-2 lg:hidden"
    itemAsChild
  >
    {steps.map((step, index) => {
      const dotActive = step.id === activeStepId;
      const stepNumber = index + 1;

      return (
        <button
          key={step.id}
          type="button"
          onClick={(event) => { onDotClick(event, step.id); }}
          aria-label={`Go to step ${stepNumber}`}
          aria-current={dotActive ? "step" : undefined}
          className={`h-2.5 w-2.5 rounded-full border border-border ${
            dotActive ? "bg-perazzi-red" : "bg-card"
          }`}
        />
      );
    })}
  </ChoreoGroup>
);

type BuildStepsExpandedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  subheading: string;
  instructions: string;
  ctaLabel: string;
  skipTargetId?: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
  collapseLabel?: string;
}>;

function BuildStepsExpandedHeader({
  headingId,
  heading,
  subheading,
  instructions,
  ctaLabel,
  skipTargetId,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
}: BuildStepsExpandedHeaderProps) {
  const headingClass = headerThemeReady ? "text-ink" : "text-white";
  const subheadingClass = headerThemeReady ? "text-ink-muted" : "text-white";
  const instructionsClass = headerThemeReady ? "text-ink-muted" : "text-white/80";

  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
      <ChoreoGroup
        effect="fade-lift"
        distance={choreoDistance.base}
        durationMs={dreamyPace.textMs}
        easing={dreamyPace.easing}
        staggerMs={dreamyPace.staggerMs}
        className="space-y-3"
      >
        <div className="relative">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className={headingClass}
          >
            {heading}
          </Heading>
        </div>
        <div className="relative">
          <Text
            size="lg"
            className={cn("type-section-subtitle", subheadingClass)}
            leading="relaxed"
          >
            {subheading}
          </Text>
        </div>
        <div className="relative">
          <Text className={cn("type-section-subtitle", instructionsClass)} leading="relaxed">
            {instructions}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ChoreoGroup
            effect="slide"
            axis="x"
            direction="left"
            distance={choreoDistance.base}
            durationMs={dreamyPace.textMs}
            easing={dreamyPace.easing}
            itemAsChild
          >
            <a
              href="#build-steps-sequence"
              className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-ink/60 text-ink hover:border-ink focus-ring"
            >
              <span>{ctaLabel}</span>
              <span aria-hidden="true">↓</span>
            </a>
          </ChoreoGroup>
          {skipTargetId ? (
            <ChoreoGroup
              effect="slide"
              axis="x"
              direction="right"
              distance={choreoDistance.base}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              delayMs={dreamyPace.staggerMs}
              itemAsChild
            >
              <a
                href={`#${skipTargetId}`}
                className="type-button inline-flex min-h-10 items-center justify-center gap-2 pill border border-perazzi-red/60 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                <span>Skip step-by-step</span>
                <span aria-hidden="true">→</span>
              </a>
            </ChoreoGroup>
          ) : null}
        </div>
      </ChoreoGroup>
      {enableTitleReveal ? (
        <ChoreoGroup
          effect="fade-lift"
          distance={choreoDistance.tight}
          delayMs={dreamyPace.staggerMs}
          durationMs={dreamyPace.textMs}
          easing={dreamyPace.easing}
          itemAsChild
        >
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
            onClick={onCollapse}
          >
            {collapseLabel}
          </button>
        </ChoreoGroup>
      ) : null}
    </div>
  );
}
