"use client";

import NextImage from "next/image";
import SafeHtml from "@/components/SafeHtml";
import type { MouseEvent, RefObject } from "react";
import type { FittingStage } from "@/types/build";
import { buildChoreoPresenceVars, choreoDistance, dreamyPace } from "@/lib/choreo";
import { cn } from "@/lib/utils";
import { ChoreoGroup, ChoreoPresence, Heading } from "@/components/ui";

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

type ChoreoPresenceVars = ReturnType<typeof buildChoreoPresenceVars>;

type BuildStepsStepCardProps = Readonly<{
  step: FittingStage;
  index: number;
  isActive: boolean;
  isOpen: boolean;
  activeStepId?: string;
  steps: readonly FittingStage[];
  setStepRef: (element: HTMLElement | null) => void;
  bodyPresenceVars: ChoreoPresenceVars;
  onToggleStepOpen: (stepId: string) => void;
  onStepCta?: (id: string) => void;
  onMobileDotClick: (event: MouseEvent<HTMLButtonElement>, stepId: string) => void;
}>;

export function BuildStepsStepList({
  steps,
  activeStepId,
  openStepId,
  stepRefs,
  scrollContainerRef,
  onToggleStepOpen,
  onStepCta,
  onMobileDotClick,
}: BuildStepsStepListProps) {
  const bodyPresenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: dreamyPace.textMs,
    enterEase: dreamyPace.easing,
    exitEase: dreamyPace.easing,
    enterY: choreoDistance.tight,
    exitY: choreoDistance.tight,
  });

  const setStepRef = (index: number) => (element: HTMLElement | null) => {
    stepRefs.current[index] = element;
  };

  return (
    <div
      className="overflow-y-auto rounded-2xl border border-border/70 bg-card/30 shadow-soft backdrop-blur-sm snap-y snap-mandatory lg:pt-24 sm:rounded-3xl h-[80vh]"
      ref={scrollContainerRef}
    >
      {steps.map((step, index) => (
        <BuildStepsStepCard
          key={step.id}
          step={step}
          index={index}
          isActive={step.id === activeStepId}
          isOpen={openStepId === step.id}
          activeStepId={activeStepId}
          steps={steps}
          setStepRef={setStepRef(index)}
          bodyPresenceVars={bodyPresenceVars}
          onToggleStepOpen={onToggleStepOpen}
          onStepCta={onStepCta}
          onMobileDotClick={onMobileDotClick}
        />
      ))}
    </div>
  );
}

const BuildStepsStepCard = ({
  step,
  index,
  isActive,
  isOpen,
  activeStepId,
  steps,
  setStepRef,
  bodyPresenceVars,
  onToggleStepOpen,
  onStepCta,
  onMobileDotClick,
}: BuildStepsStepCardProps) => {
  const hasImage = step.media?.kind === "image" && step.media.url;
  const contentId = `build-step-body-${step.id}`;

  return (
    <article
      ref={setStepRef}
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
            {hasImage ? (
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
                aria-controls={contentId}
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
                id={contentId}
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
};

type BuildStepsMobileDotsProps = Readonly<{
  steps: readonly FittingStage[];
  activeStepId?: string;
  onDotClick: (event: MouseEvent<HTMLButtonElement>, stepId: string) => void;
}>;

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
