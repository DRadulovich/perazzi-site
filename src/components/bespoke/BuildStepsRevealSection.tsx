"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import type { FittingStage } from "@/types/build";
import { logAnalytics } from "@/lib/analytics";
import { choreoDistance, dreamyPace } from "@/lib/choreo";
import {
  ChoreoGroup,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  useRevealHeight,
} from "@/components/ui";
import { BuildStepsExpandedHeader } from "@/components/bespoke/BuildStepsExpandedHeader";
import { BuildStepsRailNav } from "@/components/bespoke/BuildStepsRailNav";
import { BuildStepsStepList } from "@/components/bespoke/BuildStepsStepList";

const DEFAULT_INSTRUCTIONS =
  "Scroll to move from moment to moment. Each step is a chapter in the ritual of building a Perazzi to your measure.";

type BuildStepsRevealSectionProps = Readonly<{
  steps: readonly FittingStage[];
  heading: string;
  subheading: string;
  ctaLabel: string;
  background: { url: string; alt?: string; aspectRatio?: number };
  initialStepId?: string;
  onStepView?: (id: string) => void;
  onStepCta?: (id: string) => void;
  skipTargetId?: string;
  enableTitleReveal: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}>;

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

type BuildStepsExpandedContentProps = BuildStepsSequenceProps & Readonly<{
  headingId: string;
  heading: string;
  subheading: string;
  instructions: string;
  ctaLabel: string;
  skipTargetId?: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
}>;

const resolveActiveStepId = (steps: readonly FittingStage[], activeStepId?: string) => {
  if (steps.some((step) => step.id === activeStepId)) {
    return activeStepId;
  }
  return steps[0]?.id;
};

const resolveOpenStepId = (steps: readonly FittingStage[], openStepId?: string) => {
  if (steps.some((step) => step.id === openStepId)) {
    return openStepId;
  }
  return undefined;
};

const BuildStepsExpandedContent = ({
  headingId,
  heading,
  subheading,
  instructions,
  ctaLabel,
  skipTargetId,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  ...sequenceProps
}: BuildStepsExpandedContentProps) => (
  <RevealAnimatedBody sequence>
    <RevealItem index={0}>
      <BuildStepsExpandedHeader
        headingId={headingId}
        heading={heading}
        subheading={subheading}
        instructions={instructions}
        ctaLabel={ctaLabel}
        skipTargetId={skipTargetId}
        headerThemeReady={headerThemeReady}
        enableTitleReveal={enableTitleReveal}
        onCollapse={onCollapse}
      />
    </RevealItem>

    <RevealGroup delayMs={140}>
      <RevealItem index={0}>
        <BuildStepsSequence {...sequenceProps} />
      </RevealItem>
    </RevealGroup>
  </RevealAnimatedBody>
);

export function BuildStepsRevealSection({
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
}: BuildStepsRevealSectionProps) {
  const [buildStepsExpanded, setBuildStepsExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const [activeStepId, setActiveStepId] = useState<string | undefined>(
    () => initialStepId ?? steps[0]?.id,
  );
  const [openStepId, setOpenStepId] = useState<string | undefined>(undefined);

  const seenStepsRef = useRef(new Set<string>());
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const resolvedActiveStepId = resolveActiveStepId(steps, activeStepId);
  const resolvedOpenStepId = resolveOpenStepId(steps, openStepId);

  const revealBuildSteps = !enableTitleReveal || buildStepsExpanded;
  const revealPhotoFocus = revealBuildSteps;
  const buildStepsMinHeight = enableTitleReveal ? "min-h-[50vh]" : undefined;
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

  const scrollToStep = useCallback((index: number) => {
    const step = steps[index];
    const element = stepRefs.current[index];
    const container = scrollContainerRef.current;
    if (!step || !element) return;

    if (container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: offset, behavior: "auto" });
    } else {
      element.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [steps]);

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

    stepRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [handleStepEnter, revealBuildSteps, steps.length]);

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
          minHeightClass={buildStepsMinHeight}
          className="space-y-8 w-full"
        >
          {revealBuildSteps ? (
            <BuildStepsExpandedContent
              headingId="build-steps-heading"
              heading={heading}
              subheading={subheading}
              instructions={DEFAULT_INSTRUCTIONS}
              ctaLabel={ctaLabel}
              skipTargetId={skipTargetId}
              headerThemeReady={headerThemeReady}
              enableTitleReveal={enableTitleReveal}
              onCollapse={handleBuildStepsCollapse}
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
                <BuildStepsExpandedContent
                  headingId="build-steps-heading"
                  heading={heading}
                  subheading={subheading}
                  instructions={DEFAULT_INSTRUCTIONS}
                  ctaLabel={ctaLabel}
                  skipTargetId={skipTargetId}
                  headerThemeReady={headerThemeReady}
                  enableTitleReveal={enableTitleReveal}
                  onCollapse={handleBuildStepsCollapse}
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
              </div>
            </>
          )}
        </SectionShell>
      </div>
    </>
  );
}

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
